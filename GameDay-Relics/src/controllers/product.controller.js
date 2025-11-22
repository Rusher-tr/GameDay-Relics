import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/Apierror.js";
import { Product } from "../models/product.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Verification } from "../models/verification.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Auditlog } from "../models/auditlog.models.js";
import { Order } from "../models/order.models.js";

// working 
const getAllProducts = asyncHandler(async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = 40;
  const skip = (page - 1) * limit;

  const products = await Product.find({})
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });


  const totalProducts = await Product.countDocuments();


  const totalPages = Math.ceil(totalProducts / limit);

  return res.status(200).json(
    new ApiResponse(200, {
      products,
      pagination: {
        totalProducts,
        totalPages,
        currentPage: page,
        perPage: limit,
      },
    }, "Products fetched successfully")
  );
});


const searchProducts = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query) {
    throw new APIError(400, "Please provide a search query")
  }


  const products = await Product.find({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } }
    ]
  });

  if (!products || products.length === 0) {
    throw new APIError(404, "No products found matching your search");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      products,
      "Products fetched successfully"
    )
  );

});

// Get single product by ID
const getSingleProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new APIError(400, "Product ID is required");
  }

  const product = await Product.findById(id).populate("sellerId", "username email");

  if (!product) {
    throw new APIError(404, "Product not found");
  }

  return res.status(200).json(
    new ApiResponse(200, product, "Product fetched successfully")
  );
});

//  working on image upload part
const createProduct = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  const { title, description, price, condition, verificationId } = req.body;


  if (!sellerId) {
    throw new APIError(400, "SellerId Authentication Error");
  }


  if (
    [title, description, price, condition].some(
      (field) => field?.trim() === "",
    )
  ) {
    throw new APIError(400, "All fields are required");
  }


  if (!req.files || req.files.length === 0) {
    throw new APIError(400, "At least one product image is required");
  }

  if (req.files.length > 12) {
    throw new APIError(400, "Maximum 12 images are allowed");
  }


  console.log("Received files:", req.files.length);
  req.files.forEach((file, index) => {
    console.log(`File ${index + 1}:`, {
      originalname: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    });
  });


  const imageUploadPromises = req.files.map(file => uploadOnCloudinary(file.path));
  const uploadedImages = await Promise.all(imageUploadPromises);


  const images = uploadedImages
    .filter(img => img !== null)
    .map(img => img.url);

  if (images.length === 0) {
    throw new APIError(400, "Failed to upload images");
  }

  const newProduct = await Product.create({
    title,
    description,
    price,
    condition,
    images,
    sellerId,
    verified: !!verificationId,
    verificationId: verificationId || null,
  });

  if (!newProduct) {
    throw new APIError(500, "Something went wrong in product creation");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newProduct, "Product Created Successfully"));
});

// Working 
const updateProduct = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const productId = req.params.id;

  if (!sellerId) {
    throw new APIError(400, "SellerId Authentication Error");
  }
  if (!productId) {
    throw new APIError(400, "Product ID error")
  }

  const { title, description, price, condition, images, verificationId } =
    req.body;

  if (
    ![title, description, price, condition, images, verificationId].some(
      (field) => field !== undefined && field !== null && field.toString().trim() !== ""
    )
  ) {
    throw new APIError(400, "At least one field is required to update the product");
  }


  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      $set: {
        title,
        description,
        price,
        condition,
        images,
        sellerId,
        verified: true,
        verificationId: verificationId,
      },
    },
    { new: true }
  )
  return res.
    status(200)
    .json(new ApiResponse(200, updatedProduct, "Product updated successfully"))
});

// Enhanced deletion with order validation
const deleteProduct = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const productId = req.params.id;

  if (!userId) {
    throw new APIError(400, "Authentication Error");
  }
  if (!productId) {
    throw new APIError(400, "Product ID is required");
  }

  // Find the product first to verify ownership
  const product = await Product.findById(productId);
  if (!product) {
    throw new APIError(404, "Product not found");
  }

  // Authorization check: Seller can only delete their own products, Admin can delete any
  if (userRole === "seller" && product.sellerId.toString() !== userId.toString()) {
    throw new APIError(403, "You can only delete your own products");
  }

  // Check if product is in orders that block deletion
  const blockedOrderStatuses = ["Escrow", "shipped", "Disputed"];

  const blockedOrder = await Order.findOne({
    productId: productId,
    status: { $in: blockedOrderStatuses }
  });

  if (blockedOrder) {
    throw new APIError(
      409,
      `Cannot delete product - it has an order with status "${blockedOrder.status}". Products in Escrow, Shipped, or Disputed orders cannot be deleted. Only products in Pending, Held, Completed, or Refunded status can be deleted.`
    );
  }

  const deletedProduct = await Product.findByIdAndDelete(productId);
  if (!deletedProduct) {
    throw new APIError(500, "Product deletion failed, please retry");
  }


  const auditl = await Auditlog.create({
    amount: deletedProduct.price || 0,
    sellerId: userRole === "admin" ? product.sellerId : userId,
    action: `Product Deleted: ${deletedProduct.title} (by ${userRole})`,
  });

  if (!auditl) {
    console.warn("Audit log creation failed for product deletion");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { deletedProduct }, "Product deleted successfully"));
});


const verifiyProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const userId = req.user._id;
  const userRole = req.user.role;
  const { verificationby, certificationId, certificationURL } = req.body;


  if (!certificationId || !certificationId.trim()) {
    throw new APIError(400, "Certification ID is required");
  }

  if (!certificationURL || !certificationURL.trim()) {
    throw new APIError(400, "Certification URL is required");
  }

  if (!verificationby || !verificationby.trim()) {
    throw new APIError(400, "Verification service is required");
  }

  if (!productId) {
    throw new APIError(400, "Product ID is required");
  }


  const product = await Product.findById(productId);
  if (!product) {
    throw new APIError(404, "Product not found");
  }


  if (userRole === "seller" && product.sellerId.toString() !== userId.toString()) {
    throw new APIError(403, "You can only verify your own products");
  }

  if (product.verified === true) {
    throw new APIError(400, "Product is already verified");
  }

  try {
    const verification = await Verification.create({
      productId: productId,
      verified: true,
      verificationBy: String(verificationby).trim(),
      certificationId: String(certificationId).trim(),
      certificationURL: String(certificationURL).trim(),
      verifiedAt: new Date()
    });

    if (!verification) {
      throw new APIError(500, "Something went wrong in verification creation");
    }
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $set: {
          verified: true,
          verificationId: verification._id
        }
      },
      { new: true }
    );

    if (!updatedProduct) {
      throw new APIError(500, "Failed to update product verification status");
    }

    return res.status(200).json(
      new ApiResponse(200, {
        verification,
        product: updatedProduct
      }, "Product verified successfully")
    );
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    console.error("Verification creation error:", error);
    throw new APIError(500, `Verification failed: ${error.message || "Unknown error"}`);
  }
});

export {
  getAllProducts,
  searchProducts,
  getSingleProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  verifiyProduct,
}

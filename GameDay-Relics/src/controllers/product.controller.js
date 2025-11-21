import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/Apierror.js";
import { Product } from "../models/product.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Verification } from "../models/verification.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { Auditlog } from "../models/auditlog.models.js";

// working 
const getAllProducts = asyncHandler(async (req, res) => {
  // get page number from query (default = 1)
  const page = parseInt(req.query.page) || 1;
  const limit = 40; // number of products per page
  const skip = (page - 1) * limit;

  // find products with pagination
  const products = await Product.find({})
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 }); // optional: newest first

  // total product count
  const totalProducts = await Product.countDocuments();

  // total pages
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

// working - search products by query
const searchProducts = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query) {
    throw new APIError(400, "Please provide a search query")
  }

  // Advanced search: search by title or description (case-insensitive)
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

//  working on image upload part || no payment gateway part yet
const createProduct = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  const { title, description, price, condition, verificationId } = req.body;

  // validate sellerId
  if (!sellerId) {
    throw new APIError(400, "SellerId Authentication Error");
  }

  // validate data
  if (
    [title, description, price, condition].some(
      (field) => field?.trim() === "",
    )
  ) {
    throw new APIError(400, "All fields are required");
  }

  // Validate images
  if (!req.files || req.files.length === 0) {
    throw new APIError(400, "At least one product image is required");
  }

  if (req.files.length > 12) {
    throw new APIError(400, "Maximum 12 images are allowed");
  }

  // Debug: Log file information
  console.log("📁 Received files:", req.files.length);
  req.files.forEach((file, index) => {
    console.log(`File ${index + 1}:`, {
      originalname: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    });
  });

  // Upload images to cloudinary
  const imageUploadPromises = req.files.map(file => uploadOnCloudinary(file.path));
  const uploadedImages = await Promise.all(imageUploadPromises);

  // Filter out any failed uploads and get the URLs
  const images = uploadedImages
  .filter(img => img !== null)
  .map(img => img.url); // Only store the URLs

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

// Working
const deleteProduct = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const productId = req.params.id;

  if (!sellerId) {
    throw new APIError(400, "SellerId Authentication Error");
  }
  if (!productId) {
    throw new APIError(400, "Product ID error")
  }
  // //___________________________
  const deletedProduct = await Product.findByIdAndDelete(productId);
  if(!deleteProduct){
    throw new APIError(400,"Product Deletion Failed, Retry")
  }
  const auditl = await Auditlog.create({
    amount: createdOrder.amount,
    sellerId: sellerId,
    action: "Product Deleted",
  })
  if(!auditl){
      throw new APIError(400,"Audits Issue Caused in Product Deletion")
  }
  return res.
    status(200)
    .json(new ApiResponse(200, null, "Product deleted successfully"))

});


const verifiyProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const userId = req.user._id;
  const userRole = req.user.role;
  const { verificationby, certificationId, certificationURL } = req.body;

  // Validate required fields
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

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new APIError(404, "Product not found");
  }

  // If user is seller (not admin), verify they own the product
  if (userRole === "seller" && product.sellerId.toString() !== userId.toString()) {
    throw new APIError(403, "You can only verify your own products");
  }

  // Check if product is already verified (verified flag is true)
  if (product.verified === true) {
    throw new APIError(400, "Product is already verified");
  }

  // Create verification record
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

    // Update product: set verified = true and save verificationId reference
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
    // If it's already an APIError, re-throw it
    if (error instanceof APIError) {
      throw error;
    }
    // Otherwise, wrap it in an APIError with proper message
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

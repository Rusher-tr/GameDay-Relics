import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/Apierror.js";
import { Product } from "../models/product.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Verification } from "../models/verification.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { Auditlog } from "../models/auditlog.models.js";

// const getAllProducts = asyncHandler(async (req, res) => {
//   const products = await Product.find({});
//   return res
//     .status(200)
//     .json(
//       new ApiResponse(200, "Products fetched successfully", products),
//     );
//  });


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
    new ApiResponse(200, "Products fetched successfully", {
      products,
      pagination: {
        totalProducts,
        totalPages,
        currentPage: page,
        perPage: limit,
      },
    })
  );
});

// working
const getProductById = asyncHandler(async (req, res) => { 
  const { query } = req.query;

  if (!query) {
    throw new APIError(400, "Please provide a search query")
  }
  
  // Advanced search: search by title or description (case-insensitive)
  const products = await Product.find({
    $or: [
      { title: { $regex: query, $options: "i" } }, // Case-insensitive title search
      { description: { $regex: query, $options: "i" } } // Also search in description
    ]
  });

  if (!products || products.length === 0) {
    throw new APIError(404, "No products found matching your search");
  } 

  return res.status(200).json(
    new ApiResponse(
      200,
      "Products fetched successfully", 
      products
    )
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
    .json(new ApiResponse(201, "Product Created Successfully", newProduct));
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
    .json(new ApiResponse(200, "Product updated successfully", updatedProduct))
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
    .json(new ApiResponse(200, "Product deleted successfully", null))

});


const verifiyProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const { verified, verificationby, certificationId, certificationURL } = req.body;

  if (
    [verified, verificationby, certificationId, certificationURL].some(
      (field) => field?.trim() === "",
    )
  ) {
    throw new APIError(400, "At least one field is required to update the product");
  }

  if (!productId) {
    throw new APIError(400, "Product ID error")
  }

  const productcheck = await Product.findById(productId).select(verified);
  if(productcheck){
    throw new APIError("Product is Already Verified")
  }
  // STUCK NEED SOME SHIT HERE 

  const verification = await Verification.create({
    productId: ProductId,
    verified,
    verificationby,
    certificationId,
    certificationURL
  })
  if (!verification) { 
    throw new APIError(500, "Something went wrong in verification creation");
  }
  return res.status(200).json(new ApiResponse(200,"Product Verified In Queue, You will be notified about the results through mail",verification))

});

export {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  verifiyProduct,
}

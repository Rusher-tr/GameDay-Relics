import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/Apierror.js";
import { Product } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Mongoose, { Mongoose } from "mongoose";
import Product from "../models/product.models.js"
import Verification from "../models/verification.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

// const getAllProducts = asyncHandler(async (req, res) => {
//   const products = await Product.find({});
//   return res
//     .status(200)
//     .json(
//       new ApiResponse(200, "Products fetched successfully", products),
//     );
//  });

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

const getProductById = asyncHandler(async (req, res) => { 
  const ProductId = req.params.id;

  if (!ProductId) {
    throw new APIError(400, "Product ID error")
  }

  const Product = await Product.findById(ProductId);
  if (!Product) {
    throw new APIError(404, "Product not found");
  } 
  return res.status(200).json(new ApiResponse(200,"Product fetched successfully",Product))

});

// NEEDED MULTER + CLOUDINARY SETUP FOR IMAGE UPLOAD
const createProduct = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  const { title, description, price, condition, images, verificationId } =
    req.body;

  // validate sellerId
  if (!sellerId) {
    throw new APIError(400, "SellerId Authentication Error");
  }

  // validate data
  if (
    [title, description, price, condition, images].some(
      (field) => field?.trim() === "",
    )
  ) {
    throw new APIError(400, "All fields are required");
  }

  if (!verificationId) {
    let product = await Product.create({
      title,
      description,
      price,
      condition,
      images,
      sellerId,
      verified: false,
      verificationId: null,
    });
    if (!product) {
      throw new APIError(500, "Something went wrong in product creation");
    }
  } else {
    const { verificationId } = req.body;
    const product = await Product.create({
      title,
      description,
      price,
      condition,
      images,
      sellerId,
      verified: true,
      verificationId: verificationId,
    });
    if (!product) {
      throw new APIError(500, "Something went wrong in product creation");
    }
  }
  return res
    .status(201)
    .json(new ApiResponse(201, "Product Created Successfully", product));
});

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


  const product = await Product.findByIdAndUpdate(
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
    { $new: true }
  )
  return res.
    status(200)
    .json(new ApiResponse(200, "Product updated successfully", product))
});

const deleteProduct = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const productId = req.params.id;

  if (!sellerId) {
    throw new APIError(400, "SellerId Authentication Error");
  }
  if (!productId) {
    throw new APIError(400, "Product ID error")
  }
  const deleteP = await Product.findByIdAndDelete(productId);
  return res.
    status(200)
    .json(new ApiResponse(200, "Product deleted successfully", null))

});


const verifiyProduct = asyncHandler(async (req, res) => {
  const ProductId = req.params.id;
  const { verified, verificationby, certificationId, certificationURL } = req.body;

  if (
    [verified, verificationby, certificationId, certificationURL].some(
      (field) => field?.trim() === "",
    )
  ) {
    throw new APIError(400, "At least one field is required to update the product");
  }


  if (!ProductId) {
    throw new APIError(400, "Product ID error")
  }

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
  return res.status(200).json(new ApiResponse(200,"Product Verified Successfully",verification))

});

export {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  verifiyProduct,
}

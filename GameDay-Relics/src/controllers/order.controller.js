import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/Apierror.js";
import { Product } from "../models/product.models.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Order } from "../models/order.models.js";
import { Auditlog } from "../models/auditlog.models.js";
import { Dispute } from "../models/dispute.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// ESCROW NOT SURE IN THIS SOME WORK NEEDED HERE
// basic logic with Auditlog done
// ______________________________HAVE TO DISCUSS SOME LOGIC WITH TEAM
// const createOrder = asyncHandler(async (req, res) => {
//   const buyerId = req.user._id;
//   //const sellerId = req.body.sellerId;
//   const productId = req.body.productId;


//   if (!(buyerId && /*sellerId &&*/ productId)) {
//     throw new APIError(400, "Something Went Wrong, Try Refresing Page");
//   }

//   const buyerIdchk = await User.findById(buyerId).select("_id");
//   if (!buyerIdchk) {
//     throw new APIError(404, "Buyer Not Found or Not Registered");
//   }

//   if (!mongoose.Types.ObjectId.isValid(productId)) {
//     throw new APIError(400, "Invalid productId");
//   }

//   const product = await Product.findById(productId).select(
//     "price sellerId condition",
//   );
//   if (!product) {
//     throw new APIError(404, "Product Not Found");
//   }
//   const sellerId = product.sellerId?.toString();

//   // minimal required values so the create call doesn't reference undeclared vars
//   const amount = product.price;
//   const shippingProvider = null;
//   const trackingId = null;

//   // avoid shadowing the Order model — use a different var name
//   const createdOrder = await Order.create({
//     buyerId,
//     sellerId,
//     productId,
//     status: "pending",
//     amount,
//     escrowRelease: false,
//     shippingProvider,
//     trackingId,
//   });

//   if (!createdOrder) {
//     throw new APIError(500, "Something Went Wrong in Order Creation");
//   }

//   // __________________________________
//   // const audit = Auditlog.create({
//   //   OrderId: createdOrder._id,
//   //   amount: createdOrder.amount,
//   //   userId: buyerId,
//   //   sellerId: sellerId,
//   //   Action: "Order Created",
//   // })

//   // if(!audit){
//   //   throw new APIError(400,"Audits Issue Caused in order Creation")
//   // }

//   return res
//     .status(201)
//     .json(new ApiResponse(201, "Order Created Successfully", createdOrder));
// });


//---------------------------------------------------------------------------------------------
//---------------______________________________________________________________________
// controllers/order.controller.js
// Contains Payment Logic Working
import { createCheckoutSession_INTERNAL } from "./payment.controller.js";

const createOrder = asyncHandler(async (req, res) => {
  const buyerId = req.user._id;
  const productId = req.body.productId;

  if (!buyerId || !productId) throw new APIError(400, "Missing buyerId or productId");

  const buyer = await User.findById(buyerId).select("_id");
  if (!buyer) throw new APIError(404, "Buyer not found");

  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new APIError(400, "Invalid productId");

  const product = await Product.findById(productId).select("price sellerId title description");
  if (!product) throw new APIError(404, "Product not found");

  const createdOrder = await Order.create({
    buyerId,
    sellerId,
    productId,
    status: "pending",
    amount,
    escrowRelease: false,
    shippingProvider,
    trackingId,
    transactionId: null, 
  });

  // Create Stripe Checkout session
  const session = await createCheckoutSession_INTERNAL(buyerId, createdOrder._id);

  res.status(201).json({
    success: true,
    order,
    checkoutUrl: session.url,
  });
});

//---------------------------------------------------------------------------------------------
//     const Selleridchk = product.sellerId?.toString();
//     if (!Selleridchk){
//         throw new APIError(404, "Seller Not Found for this Product");
//     }

//     // if (sellerId !== Selleridchk) {
//     //     throw new APIError(400, "SellerId does not match with product's sellerId");
//     // }

//     const Order = await Order.create({
//         buyerId,
//         sellerId,
//         productId,
//         status: "pending",
//         amount,
//         escrowRelease: false,
//         shippingProvider,
//         trackingId,
//     })
//     if (!Order) {
//         throw new APIError(500, "Something Went Wrong in Order Creation");
//     }
//     return res.status(201).json(new ApiResponse(201, "Order Created Successfully", Order));
// });

const getOrderById = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const buyerId = req.user._id;

  if (!(orderId && buyerId)) {
    throw new APIError(400, "Something Went Wrong, Try Refresing Page");
  }
  const order = await Order.findOne({ _id: order });
  if (!order) {
    throw new APIError(404, "Order Not Found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Order Fetched Successfully", order));
});

// Working ( NOT TESTED FOR MULTIPLE CASES)
const cancelOrder = asyncHandler(async (req, res) => {
  const OrderId = req.params.id;
  const buyerId = req.user._id;

  if (!(OrderId && buyerId)) {
    throw new APIError(400, "Something Went Wrong, Try Refresing Page");
  }

  const order = await Order.findById(OrderId);

  if (!order) {
    throw new APIError(404, "Order Not Found or Can't be cancelled");
  }

  if (order.status !== "pending") {
    throw new APIError(400, "Only pending orders can be cancelled");
  }

  const deleted = await Order.deleteOne({
    _id: OrderId,
    buyerId: buyerId
  });

  if (!deleted) {
    throw new APIError(400, "Order Deletion Failed")
  }
  const auditl = await Auditlog.create({
    userId: buyerId,
    sellerId: order.sellerId,
    action: "Order Cancelled",
    amount: order.amount,
  });

  if (!auditl) {
    throw new APIError(400, "Audits Issue Caused in order Cancelation")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Order Cancelled Successfully", order));
});

// UNFINISHED
// Not Tested NO ADMIN RN
const updateOrder = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const adminId = req.user._id;
  const { status } = req.body;

  const admincheck = await User.findById(adminId).select("role");
  if (admincheck.role !== "admin") {
    throw new APIError(403, "You are not authorized to perform this action");
  }

  if (!(orderId && adminId)) {
    throw new APIError(400, "Something Went Wrong with Auth, Try Refresing Page");
  }

  const Order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: status,
    },
    req.body,
    { new: true },
  );

  if (!Order) {
    throw new APIError(404, "Order Not Found or Can't be updated");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Order Updated Successfully", Order));
});

// Working
const getOrdersByUser = asyncHandler(async (req, res) => {
  const buyerId = req.user._id;

  if (!buyerId) {
    throw new APIError(400, "Something Went Wrong, Try Refresing Page");
  }

  const orders = await Order.find({ buyerId: buyerId });
  return res
    .status(200)
    .json(new ApiResponse(200, "Orders Fetched Successfully", orders));
});

// Working
const getOrdersBySeller = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  if (!sellerId) {
    throw new APIError(400, "Authentication Error", null);
  }

  const orders = await Order.findOne({
    sellerId,
  });

  if (!orders) {
    throw new APIError(404, "No Orders Found for this Seller", null);
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Orders Fetched Successfully", orders));
});

// working 
const raiseDispute = asyncHandler(async (req, res) => {
  const buyerId = req.user._id;
  const orderId = req.params.id;
  const { reason, inspectionProvider, inspectionCertificationId, inspectionUrl } = req.body;

  if (!(buyerId && orderId)) {
    throw new APIError(400, "Authentication Error, Try Refresing Page OR Login Again");
  }
  if (!(reason)) {
    throw new APIError(400, "Dispute reason and Evidence is required");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new APIError(404, "Order not found for to raise the Dispute");
  }


  if (!req.files || req.files.length === 0) {
    throw new APIError(400, "At least one Evidence image is required");
  }

  if (req.files.length > 12) {
    throw new APIError(400, "Maximum 10 Evidence images are allowed");
  }

  // Upload images to cloudinary
  const imageUploadPromises = req.files.map(file => uploadOnCloudinary(file.path));
  const uploadedImages = await Promise.all(imageUploadPromises);

  // Filter out any failed uploads and get the URLs
  const evidence = uploadedImages
    .filter(img => img !== null)
    .map(img => img.url); // Only store the URLs

  if (evidence.length === 0) {
    throw new APIError(400, "Failed to upload images");
  }

  const disputecreation = await Dispute.create({
    orderId,
    buyerId,
    sellerId: order.sellerId,
    evidence,
    reason,
    status: "Open",
    resolvedBy: null,
    evidence,
    inspectionCertificationId: inspectionCertificationId || null,
    inspectionProvider: inspectionProvider || null,
    inspectionUrl: inspectionUrl || null,
  })

  if (!disputecreation) {
    throw new APIError(400, "Dispute Creation Failed")
  }
  const auditl = await Auditlog.create({
    sellerId: order.sellerId,
    userId: buyerId,
    action: "Dispute Raised",
    amount: order.amount,
  });
  if (!auditl) {
    throw new APIError(400, "Audit Creation Failed for Raising Dispute ")
  }
  return res.status(200).json(new ApiResponse(200, "Dispute Raised Successfully"), null);
});

// UNFINISHED
const HoldinEscrow = asyncHandler(async (req, res) => { });
//
const releaseEscrow = asyncHandler(async (req, res) => { });
//
const refundOrder = asyncHandler(async (req, res) => { });


// const LogOrderAction = asyncHandler(async (req, res) => {
//   const OrderId = req.params._id;
//   const UserId = req.user._id;

//   if (!(OrderId || UserId)) {
//     throw new APIError(400, "Authentication Error");
//   }
//   const Action = "Order Placed";
//   const Auditlog = await Auditlog.Create({
//     OrderId,
//     UserId,
//     Action,
//     Amount: mongoose.Types.ObjectId(OrderId),
//   });
//   return res
//     .status(201)
//     .json(new ApiResponse(201, "Order Action Logged Successfully", {}));
// });

export {
  createOrder,
  getOrderById,
  cancelOrder,
  updateOrder,
  raiseDispute,
  getOrdersByUser,
  getOrdersBySeller,
  HoldinEscrow,
  releaseEscrow,
  refundOrder,
  //LogOrderAction,
};

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
import { createCheckoutSession_INTERNAL } from "./payment.controller.js";

const createOrder = asyncHandler(async (req, res) => {
  const buyerId = req.user._id;
  const userRole = req.user.role;
  const productId = req.body.productId;

  if (!buyerId || !productId) throw new APIError(400, "Missing buyerId or productId");

  if (userRole === 'seller') {
    throw new APIError(403, "Sellers cannot purchase products. Only buyers and admins can create orders.");
  }

  const buyer = await User.findById(buyerId).select("_id role");
  if (!buyer) throw new APIError(404, "User not found");

  if (buyer.role === 'seller') {
    throw new APIError(403, "Sellers cannot purchase products");
  }

  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new APIError(400, "Invalid productId");

  const product = await Product.findById(productId).select("price sellerId title description");
  if (!product) throw new APIError(404, "Product not found");

  const sellerId = product.sellerId;
  const amount = product.price;

  const createdOrder = await Order.create({
    buyerId,
    sellerId,
    productId,
    status: "pending",
    amount,
    escrowRelease: false,
    shippingProvider: null,
    trackingNumber: null,
    transactionId: null,
  });

  const session = await createCheckoutSession_INTERNAL(buyerId, createdOrder._id);

  res.status(201).json({
    success: true,
    order: createdOrder,
    checkoutUrl: session.url,
  });
});

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

  const orders = await Order.find({ buyerId: buyerId }).populate("productId").populate("sellerId", "username email");
  return res
    .status(200)
    .json(new ApiResponse(200, orders, "Orders Fetched Successfully"));
});

// Working
const getOrdersBySeller = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  if (!sellerId) {
    throw new APIError(400, "Authentication Error", null);
  }

  const orders = await Order.find({
    sellerId,
  }).populate("productId").populate("buyerId", "username email");

  if (!orders || orders.length === 0) {
    throw new APIError(404, "No Orders Found for this Seller", null);
  }

  res
    .status(200)
    .json(new ApiResponse(200, orders, "Orders Fetched Successfully"));
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

  const imageUploadPromises = req.files.map(file => uploadOnCloudinary(file.path));
  const uploadedImages = await Promise.all(imageUploadPromises);

  const evidence = uploadedImages
    .filter(img => img !== null)
    .map(img => img.url); 

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

  // Update order status and buyer sat
  order.status = "Disputed";
  order.buyerSatisfaction = "disputed";
  await order.save();

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

const markBuyerSatisfaction = asyncHandler(async (req, res) => {
  const buyerId = req.user._id;
  const orderId = req.params.id;
  const { satisfaction } = req.body; 

  if (!buyerId || !orderId) {
    throw new APIError(400, "Authentication Error");
  }

  if (!satisfaction || !["satisfied", "fine"].includes(satisfaction)) {
    throw new APIError(400, "Invalid satisfaction value. Must be 'satisfied' or 'fine'");
  }

  const order = await Order.findOne({ _id: orderId, buyerId });
  if (!order) {
    throw new APIError(404, "Order not found or you don't have permission");
  }

  if (!["shipped", "Held", "Escrow"].includes(order.status)) {
    throw new APIError(400, "Can only mark satisfaction for delivered orders");
  }

  if (order.buyerSatisfaction !== "pending") {
    throw new APIError(400, "Satisfaction already marked for this order");
  }

  order.buyerSatisfaction = satisfaction;
  await order.save();

  await Auditlog.create({
    userId: buyerId,
    sellerId: order.sellerId,
    action: `Buyer marked order as ${satisfaction}`,
    amount: order.amount,
  });

  return res.status(200).json(
    new ApiResponse(200, order, `Order marked as ${satisfaction} successfully`)
  );
});

const selectDeliveryGateway = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const buyerId = req.user._id;
  const { deliveryGatewayOptions } = req.body;

  if (!orderId || !buyerId) {
    throw new APIError(400, "Order ID and buyer authentication required");
  }

  if (!deliveryGatewayOptions || !Array.isArray(deliveryGatewayOptions) || deliveryGatewayOptions.length === 0) {
    throw new APIError(400, "Please select at least one delivery gateway option");
  }

  
  const validGateways = ["DHL", "FedEx", "TCS", "Leopard", "M&P"];
  const invalidOptions = deliveryGatewayOptions.filter(opt => !validGateways.includes(opt));
  if (invalidOptions.length > 0) {
    throw new APIError(400, `Invalid gateway options: ${invalidOptions.join(', ')}`);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new APIError(404, "Order not found");
  }

  if (order.buyerId.toString() !== buyerId.toString()) {
    throw new APIError(403, "Unauthorized: You can only select delivery for your own orders");
  }

  order.deliveryGatewayOptions = deliveryGatewayOptions;
  await order.save();

  return res.status(200).json(
    new ApiResponse(200, order, "Delivery gateway options saved successfully")
  );
});

const confirmShippingProvider = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const sellerId = req.user._id;
  const { shippingProvider, trackingNumber } = req.body;

  if (!orderId || !sellerId) {
    throw new APIError(400, "Order ID and seller authentication required");
  }

  if (!shippingProvider) {
    throw new APIError(400, "Please select a shipping provider");
  }

  const validGateways = ["DHL", "FedEx", "TCS", "Leopard", "M&P"];
  if (!validGateways.includes(shippingProvider)) {
    throw new APIError(400, `Invalid shipping provider: ${shippingProvider}`);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new APIError(404, "Order not found");
  }

  if (order.sellerId.toString() !== sellerId.toString()) {
    throw new APIError(403, "Unauthorized: You can only update shipping for your own orders");
  }

  if (!order.deliveryGatewayOptions.includes(shippingProvider)) {
    throw new APIError(400, `Buyer did not approve ${shippingProvider} as a delivery option`);
  }
  if (!["Escrow", "Held"].includes(order.status)) {
    throw new APIError(400, `Cannot update shipping provider for order in ${order.status} status. Order must be in Escrow or Held status.`);
  }

  order.deliveryGatewaySelected = shippingProvider;
  order.shippingProvider = shippingProvider;
  if (trackingNumber) {
    order.trackingNumber = trackingNumber;
  }
  order.status = "shipped";
  await order.save();

  await Auditlog.create({
    action: "Shipping Provider Confirmed",
    userId: sellerId,
    amount: order.amount,
  });

  return res.status(200).json(
    new ApiResponse(200, order, "Shipping provider confirmed and order marked as shipped")
  );
});

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
  markBuyerSatisfaction,
  selectDeliveryGateway,
  confirmShippingProvider,
  HoldinEscrow,
  releaseEscrow,
  refundOrder,
  //LogOrderAction,
};

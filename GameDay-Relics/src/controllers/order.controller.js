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
    deliveryGatewayOptions: ["DHL", "FedEx", "TCS", "Leopard", "M&P"],
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

// Manual Status Update (For Admin/Dev use to fix stuck orders)
const updateOrder = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user._id;
  const { status } = req.body;

  if (!status) {
    throw new APIError(400, "Status is required");
  }

  const user = await User.findById(userId);

  // Allow admin to update any order
  // Also allow seller/buyer to update for testing if needed (or restrict to admin only)
  // For now, we'll restrict to admin for safety, but if you need it for dev testing, we can relax it.
  // Let's allow the seller to update to "Escrow" if it's stuck in pending (simulating payment)

  const order = await Order.findById(orderId);
  if (!order) {
    throw new APIError(404, "Order not found");
  }

  // Authorization check
  if (user.role !== "admin") {
    // Allow seller to simulate payment success (Pending -> Escrow) for testing
    if (user.role === "seller" && order.sellerId.toString() === userId.toString() && status === "Escrow" && order.status === "pending") {
      // Allowed for testing flow
    } else {
      throw new APIError(403, "You are not authorized to perform this action");
    }
  }

  const updatedOrder = await Order.findByIdAndUpdate(
    orderId,
    {
      status: status,
      // If moving to Escrow, set deadline
      ...(status === "Escrow" ? {
        sellerConfirmationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      } : {})
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedOrder, "Order Updated Successfully"));
});

// Working
const getOrdersByUser = asyncHandler(async (req, res) => {
  const buyerId = req.user._id;

  if (!buyerId) {
    throw new APIError(400, "Something Went Wrong, Try Refresing Page");
  }

  const orders = await Order.find({ buyerId: buyerId }).populate("productId").populate("sellerId", "username email").sort({ createdAt: -1 });
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
  }).populate("productId").populate("buyerId", "username email").sort({ createdAt: -1 });

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
  order.autoSatisfactionDate = null; // Clear auto-satisfaction date so it won't auto-release
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

  // Mark satisfaction
  order.buyerSatisfaction = satisfaction;

  // Set delivery confirmed timestamp when buyer marks satisfaction
  if (!order.sellerDeliveryConfirmed) {
    order.sellerDeliveryConfirmed = new Date();
  }

  // Change status to in_transit to show package is on the way
  // order.status = "in_transit";

  // Set auto-satisfaction date to 7 days from now
  const autoSatDate = new Date();
  autoSatDate.setDate(autoSatDate.getDate() + 7);
  order.autoSatisfactionDate = autoSatDate;

  await order.save();

  await Auditlog.create({
    userId: buyerId,
    sellerId: order.sellerId,
    action: `Buyer marked order as ${satisfaction}`,
    amount: order.amount,
  });

  return res.status(200).json(
    new ApiResponse(200, order, `Order marked as ${satisfaction} successfully`))

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
    throw new APIError(400, "Shipping provider is required");
  }

  if (!trackingNumber) {
    throw new APIError(400, "Tracking number is required");
  }

  const validGateways = ["DHL", "FedEx", "TCS", "Leopard", "M&P"];
  if (!validGateways.includes(shippingProvider)) {
    throw new APIError(400, `Invalid shipping provider. Must be one of: ${validGateways.join(', ')}`);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new APIError(404, "Order not found");
  }

  if (order.sellerId.toString() !== sellerId.toString()) {
    throw new APIError(403, "Unauthorized: You can only confirm shipping for your own orders");
  }

  // Check if buyer has selected delivery gateway options
  if (!order.deliveryGatewayOptions || order.deliveryGatewayOptions.length === 0) {
    throw new APIError(400, "Buyer has not selected delivery gateway options yet");
  }

  // Verify that the selected shipping provider is one of the buyer's options
  if (!order.deliveryGatewayOptions.includes(shippingProvider)) {
    throw new APIError(400, `Selected shipping provider must be one of the buyer's choices: ${order.deliveryGatewayOptions.join(', ')}`);
  }

  // Update order with confirmed shipping provider
  order.shippingProvider = shippingProvider;
  order.trackingNumber = trackingNumber;
  order.status = "shipped";
  await order.save();

  await Auditlog.create({
    action: `Seller Confirmed Shipping Provider: ${shippingProvider} - Tracking: ${trackingNumber}`,
    userId: sellerId,
    sellerId: sellerId,
    amount: order.amount,
  });

  return res.status(200).json(
    new ApiResponse(200, order, `Shipping provider ${shippingProvider} confirmed successfully`)
  );
});

const confirmDelivery = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const sellerId = req.user._id;

  if (!orderId || !sellerId) {
    throw new APIError(400, "Order ID and seller authentication required");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new APIError(404, "Order not found");
  }

  if (order.sellerId.toString() !== sellerId.toString()) {
    throw new APIError(403, "Unauthorized: You can only confirm delivery for your own orders");
  }

  // Seller can only confirm delivery after buyer has marked satisfaction
  if (order.buyerSatisfaction === "pending") {
    throw new APIError(400, "Buyer has not yet marked their satisfaction. Please wait for the buyer to confirm receipt.");
  }

  if (order.status !== "in_transit") {
    throw new APIError(400, `Cannot confirm delivery for order in ${order.status} status. Order must be in 'in_transit' status.`);
  }

  // Mark that seller has confirmed delivery
  // Order stays in 'in_transit' status - admin must manually release escrow
  if (!order.sellerDeliveryConfirmed) {
    order.sellerDeliveryConfirmed = new Date();
  }
  await order.save();

  await Auditlog.create({
    action: "Seller Confirmed Delivery - Awaiting Admin Escrow Release",
    userId: sellerId,
    amount: order.amount,
  });

  return res.status(200).json(
    new ApiResponse(200, order, "Delivery confirmed successfully. Order is now pending admin escrow release.")
  );
});




const processAutoSatisfaction = asyncHandler(async (req, res) => {
  // This endpoint is for internal use (cron jobs)
  // It automatically marks orders as satisfied if the autoSatisfactionDate has passed

  const now = new Date();

  // Find all orders where:
  // - autoSatisfactionDate exists and has passed
  // - buyerSatisfaction is still 'pending'
  // - status is 'in_transit' (not disputed)
  const orders = await Order.find({
    autoSatisfactionDate: { $lte: now },
    buyerSatisfaction: "pending",
    status: "in_transit"
  });

  if (orders.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, { processed: 0 }, "No orders to auto-satisfy")
    );
  }

  let processedCount = 0;
  for (const order of orders) {
    try {
      order.buyerSatisfaction = "satisfied";
      order.autoSatisfactionDate = null;
      await order.save();

      await Auditlog.create({
        userId: order.buyerId,
        sellerId: order.sellerId,
        action: "Order auto-marked as satisfied after 7 days",
        amount: order.amount,
      });

      processedCount++;
    } catch (error) {
      console.error(`Failed to auto-satisfy order ${order._id}:`, error);
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { processed: processedCount }, `${processedCount} orders auto-satisfied`)
  );
});

const processExpiredSellerConfirmations = asyncHandler(async (req, res) => {
  // This endpoint is for internal use (cron jobs)
  // It automatically cancels orders if seller confirmation deadline has passed

  const now = new Date();

  // Find all orders where:
  // - sellerConfirmationDeadline exists and has passed
  // - Status is still 'Escrow' or 'Held' (seller hasn't confirmed yet)
  // - Order hasn't been cancelled already
  const orders = await Order.find({
    sellerConfirmationDeadline: { $lte: now },
    status: { $in: ["Escrow", "Held"] },
  });

  if (orders.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, { processed: 0 }, "No orders to auto-cancel")
    );
  }

  let processedCount = 0;
  for (const order of orders) {
    try {
      order.status = "Cancelled";
      order.cancelledReason = "Seller did not confirm order within 7 days";
      order.sellerConfirmationDeadline = null;
      await order.save();

      await Auditlog.create({
        userId: order.buyerId,
        sellerId: order.sellerId,
        action: "Order auto-cancelled - Seller did not confirm within 7 days",
        amount: order.amount,
      });

      processedCount++;
    } catch (error) {
      console.error(`Failed to auto-cancel order ${order._id}:`, error);
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { processed: processedCount }, `${processedCount} orders auto-cancelled`)
  );
});

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
  confirmDelivery,
  processAutoSatisfaction,
  processExpiredSellerConfirmations,
};


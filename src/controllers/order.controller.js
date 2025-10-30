import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/Apierror.js";
import { Product } from "../models/product.models.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Order } from "../models/order.models.js";
import { Auditlog } from "../models/auditlog.models.js";

// ESCROW NOT SURE IN THIS SOME WORK NEEDED HERE
// basic logic with Auditlog done
// ______________________________HAVE TO DISCUSS SOME LOGIC WITH TEAM
const createOrder = asyncHandler(async (req, res) => {
  const buyerId = req.user._id;
  //const sellerId = req.body.sellerId;
  const productId = req.body.productId;
  
  /// HAVE TO DISCUSS SOMETHING HERE WITH TEAM
//   const checkexistingproduct = await Order.findOne({
//     buyerId: buyerId,
//     productId: productId,
//     status: { $in: ["pending", "shipped"] },
//   });
//  
//   if (checkexistingproduct) {
//     throw new APIError(409, "An active order already exists for this product");
//   }


  if (!(buyerId && /*sellerId &&*/ productId)) {
    throw new APIError(400, "Something Went Wrong, Try Refresing Page");
  }

  const buyerIdchk = await User.findById(buyerId).select("_id");
  if (!buyerIdchk) {
    throw new APIError(404, "Buyer Not Found or Not Registered");
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new APIError(400, "Invalid productId");
  }

  const product = await Product.findById(productId).select(
    "price sellerId condition",
  );
  if (!product) {
    throw new APIError(404, "Product Not Found");
  }
  const sellerId = product.sellerId?.toString();
    
  // minimal required values so the create call doesn't reference undeclared vars
  const amount = product.price;
  const shippingProvider = null;
  const trackingId = null;

  // avoid shadowing the Order model — use a different var name
  const createdOrder = await Order.create({
    buyerId,
    sellerId,
    productId,
    status: "pending",
    amount,
    escrowRelease: false,
    shippingProvider,
    trackingId,
  });

  if (!createdOrder) {
    throw new APIError(500, "Something Went Wrong in Order Creation");
  }

  Auditlog.create({
    OrderId: createdOrder._id,
    amount: createdOrder.amount,
    userId: buyerId,
    sellerId: sellerId,
    Action: "Order Created",
  })

  return res
    .status(201)
    .json(new ApiResponse(201, "Order Created Successfully", createdOrder));
});

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
  
  if (deleted){
    await Auditlog.create({
      userId: buyerId,
      sellerId: order.sellerId,
      action: "Order Cancelled",
      amount: order.amount,
    });
  }

//   const order = await Order.findOneandDelete({
//     _id: OrderId,
//     buyerId: buyerId,
//     status: "pending",
//   });

  
  return res
    .status(200)
    .json(new ApiResponse(200, "Order Cancelled Successfully", order));
});

// UNFINISHED
// Not Tested NO ADMIN RN
const updateOrder = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const adminId = req.user._id;
  const {status} = req.body;

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

// UNFINISHED
const HoldinEscrow = asyncHandler(async (req, res) => {});
//
const releaseEscrow = asyncHandler(async (req, res) => {});
//
const refundOrder = asyncHandler(async (req, res) => {});

const raiseDispute = asyncHandler(async (req, res) => {
    const buyerId = req.user._id;
    const orderId = req.params.id;
    const { reason } = req.body;

    if (!(buyerId && orderId)) {
        throw new APIError(400, "Authentication Error, Try Refresing Page OR Login Again");
    }
    if (!reason){
        throw new APIError(400, "Dispute reason is required");
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new APIError(404, "Order Not Found");
    }
    if (order.buyerId.toString() !== buyerId.toString()) {
        throw new APIError(403, "You are not authorized to raise dispute for this order");
    }
    await Order.findByIdAndUpdate(orderId,
        { status: "disputed" },
        { new: true });
    await Auditlog.create({
        OrderId: orderId,
        userId: buyerId,
        action: "Dispute Raised",
        Amount: order.amount,
    });
    return res.status(200).json(new ApiResponse(200, "Dispute Raised Successfully"),null);
});


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

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/Apierror.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";
import {Product}from "../models/product.models.js";
import { Order } from "../models/order.models.js";
import {Auditlog} from "../models/auditlog.models.js";

// Working
const forceCancelOrder = asyncHandler(async (req, res) => {
  const AdminId = req.user._id;
  const orderId = req.params.id;

  if (!(AdminId && orderId)) {
    throw new APIError(400, "Authentication Error, Try Refresing Page");
  }
  const admincheck = await User.findById(AdminId);
  if (!admincheck || admincheck.role !== "admin") {
    throw new APIError(403, "Unauthorized: Admin access required");
  }
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: { $in: ["pending", "shipped"] },
    },
    { status: "cancelled" },
    { new: true }
  );

  if (!order) {
    throw new APIError(400, "Order Not Found or Can't be cancelled");
  }
  return res.status(200).json({
    status: 200,
    message: "Order Forcefully Cancelled by Admin",
    data: order,
  });
});

// Working
const getAllUsers = asyncHandler(async (req, res) => {
  const adminid = req.user._id;
  if (!adminid) {
    throw new APIError(400, "Authentication Error, Try Refresing Page");
  }
  const admincheck = await User.findById(adminid);
  if (!admincheck || admincheck.role !== "admin") {
    throw new APIError(403, "Unauthorized: Admin access required");
  }
  const users = await User.find().select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, "Users Fetched Successfully", users));
});

// Working
const getOrderAmountStats = asyncHandler(async (req, res) => {
  const adminid = req.user._id;
  if (!adminid) {
    throw new APIError(400, "Authentication Error, Try Refreshing Page");
  }
  const admincheck = await User.findById(adminid);
  if (!admincheck || admincheck.role !== "admin") {
    throw new APIError(403, "Unauthorized: Admin access required");
  }
  const stats = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        averageAmount: { $avg: "$amount" },
        minAmount: { $min: "$amount" },
        maxAmount: { $max: "$amount" },
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Order Amount Stats Fetched Successfully", stats[0])
    );
});

// Working
const getAllOrders = asyncHandler(async (req, res) => {
  const adminid = req.user._id;
  if (!adminid) {
    throw new APIError(400, "Authentication Error, Try Refreshing Page");
  }
  const admincheck = await User.findById(adminid);
  if (!admincheck || admincheck.role !== "admin") {
    throw new APIError(403, "Unauthorized: Admin access required");
  }
  const Orders = await Order.find();
  return res
    .status(200)
    .json(new ApiResponse(200, "All Orders Fetched Successfully", Orders));
});

// Working
const forcedDeleteUser = asyncHandler(async (req, res) => {
  const adminid = req.user._id;
  const userIdToDelete = req.params.id;
  if (!userIdToDelete) {
    throw new APIError(400, "User ID to delete is required");
  }
  if (!adminid) {
    throw new APIError(400, "Authentication Error, Try Refreshing Page");
  }
  const admincheck = await User.findById(adminid);
  if (!admincheck || admincheck.role !== "admin") {
    throw new APIError(403, "Unauthorized: Admin access required");
  }
  const checkUser = await User.findById(userIdToDelete).select("role");
  if (!checkUser || checkUser.role === "admin") {
    throw new APIError(400, "Cannot Delete Admin or Non-Existent User");
  }
  const usertoDelete = await User.findById(userIdToDelete).select("-password");
  if (!usertoDelete) {
    throw new APIError(404, "User Not Found");
  }
  await User.findByIdAndDelete(userIdToDelete);
  return res
    .status(200)
    .json(new ApiResponse(200, "User Deleted Successfully", usertoDelete));
});

//______________________________________________________________________
const solveDispute = asyncHandler(async (req, res) => {});

const forceRefund = asyncHandler(async (req, res) => {});

export {
  forceCancelOrder,
  getAllUsers, 
  getAllOrders,
  getOrderAmountStats,
  forcedDeleteUser,
};
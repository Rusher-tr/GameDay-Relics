import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/Apierror.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { Product } from "../models/product.models.js";
import { Order } from "../models/order.models.js";
import { Auditlog } from "../models/auditlog.models.js";
import { Dispute } from "../models/dispute.models.js";

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

  //_______________________________________________________
  const auditlog = await Auditlog.create({
    action: "Order Cancelled",
    amount: order.amount,
    sellerId: order.sellerId,
    userId: AdminId,
  });
  if (!auditlog) {
    throw new APIError(400, "Audits Issue Caused in order Cancelation");
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

  if (!stats) {
    throw new APIError(400, "Stats Retrieve Error");
  }

  const auditlog = await Auditlog.create({
    action: "Amount Stats Retrieved",
    amount: stats,
    userId: adminId,
  });

  if (!auditlog) {
    throw new APIError(400, "Audits Issue Caused in Stats Retrieval");
  }

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

  const deleteduser = await User.findByIdAndDelete(checkUser._id);

  if (!deleteduser) {
    throw new APIError(400, "Can Delete User")
  }
  const auditlog = await Auditlog.create({
    action: "User Deleted",
    userId: adminid,
  });

  if (!auditlog) {
    throw new APIError(400, "Audits Issue Caused in User Deletion");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User Deleted Successfully", usertoDelete));
});

//______________________________________________________________________
const solveDispute = asyncHandler(async (req, res) => {
  const adminid = req.user._id
  const userid = req.params.id

  if (!userid) {
    throw new APIError(400, "Invalid Buyer Id")
  }

  if (!adminid) {
    throw new APIError(400, "Admin ID authentication Failed")
  }

  const disputes = await Dispute.find({
    status: "Open",
    $or: [
      { buyerId: userid },
      { sellerId: userid },
    ],
  });

  if (!disputes) {
    throw new APIError(400, "Dispute Not Found")
  }
  const disputesamount = disputes.orderId.amount

  const auditl = await Auditlog.create({
    sellerId: disputes.sellerId,
    userId: adminid,
    action: "Dispute Solved",
    amount: disputesamount,
  });

  if (!auditl) {
    throw new APIError(400, "Audit Creation Failed for Raising Dispute ")
  }
  return res.status(200).json(new ApiResponse(200, "Dispute Raised Successfully"));

});

// working--haven't tested the pending order condition
const removeProduct = asyncHandler(async(req,res)=>{
  const adminId = req.user._id
  const productId = req.params.id

  if(!adminId){
    throw new APIError(400,"Admin Id Authentication Error")
  }
  if(!productId){
    throw new APIError(400,"Product Id is invalid")
  }
  
  const productnotordered = await Order.findById(productId).select("Escrow Held Disputed ")
  if (productnotordered.tostring()==="Escrow" || productnotordered.tostring()==="Held" || productnotordered.tostring()=== "Disputed"){
    throw new APIError(400,"Can't Delete Product if its ordered and order is in progress")
  }

  const producttodelete = await Product.findByIdAndDelete(productId)
  
  if(!producttodelete){
     throw new APIError(400,"Product doesn't Exist or Deletion Failed")
  }

  const auditl = await Auditlog.create({
    userId: adminId,
    action: "Force Product Deletion",
    //amount: producttodelete.amount,
  });

  if (!auditl) {
    throw new APIError(400, "Audit Creation Failed for Raising Dispute ")
  }
  res.status(200).json(200,new ApiResponse(200,"Forced Product Deleted"))
});

const forceRefund = asyncHandler(async (req, res) => { });

export {
  forceCancelOrder,
  getAllUsers,
  getAllOrders,
  getOrderAmountStats,
  forcedDeleteUser,
  solveDispute,
  removeProduct
};
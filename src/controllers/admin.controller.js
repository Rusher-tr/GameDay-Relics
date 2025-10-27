import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/Apierror.js";
import { Product } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose  from "mongoose";
import Product from "../models/product.models.js"
import Order, { Order } from "../models/order.models.js"
import Auditlog from "../models/auditlog.models.js"

const forceCancelOrder = asyncHandler(async (req, res) => {
    const AdminId = req.params._id
    const orderId = req.body.orderId;

    if (!(AdminId && orderId)) {
        throw new APIError(400, "Authentication Error, Try Refresing Page");
    }

    const order = await Order.findOneAndUpdate({ _id: orderId, status: { $in: ["pending", "shipped"] } }, { status: "cancelled" }, { new: true });

    if (!order){
        throw new APIError()
    }
});

const getAllUsers = asyncHandler(async (req, res) => {});

const getOrderAmountStats = asyncHandler(async (req, res) => {});

const solveDispute = asyncHandler(async (req, res) => {});  

const forceRefund = asyncHandler(async (req,res) =>{});


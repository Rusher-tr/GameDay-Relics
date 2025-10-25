import { asyncHandler } from "../utils/asyncHandler";
import { APIError } from "../utils/Apierror";
import { Product } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose  from "mongoose";
import Product from "../models/product.models.js"
import Order, { Order } from "../models/order.models.js"
import Auditlog from "../models/auditlog.models.js"


// ESCROW NOT SURE IN THIS SOME WORK NEEDED HERE
const createOrder = asyncHandler(async (req, res) => {
    const buyerId = req.user._id;
    const sellerId = req.body.sellerId;
    const productId = req.body.productId;

    if (!(buyerId && sellerId && productId)) {
        throw new APIError(400, "Something Went Wrong, Try Refresing Page");
    }

    const Order = await Order.create({
        buyerId,
        sellerId,
        productId,
        status: "pending",
        amount,
        escrowRelease: false,
        shippingProvider,
        trackingId,
    })
    if (!Order) {
        throw new APIError(500, "Something Went Wrong in Order Creation");
    }
    return res.status(201).json(new ApiResponse(201, "Order Created Successfully", Order));

});

const getOrderById = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const buyerId = req.user._id;

    if (!(orderId && buyerId)) {
        throw new APIError(400, "Something Went Wrong, Try Refresing Page");
    }
    const order = await Order.findOne({ _id: order })
    if (!order) {
        throw new APIError(404, "Order Not Found");
    }
    return res.status(200).json(new ApiResponse(200, "Order Fetched Successfully", order));
});

const cancelOrder = asyncHandler(async (req, res) => {
    const OrderId = req.params._id;
    const buyerId = req.user._id

    if (!(OrderId && buyerId)) {
        throw new APIError(400, "Something Went Wrong, Try Refresing Page");
    }

    const order = await Order.findOneandDelete({ _id: OrderId, buyerId: buyerId, status: "pending" });
    if (!order) {
        throw new APIError(404, "Order Not Found or Can't be cancelled");
    }
    return res.status(200).json(new ApiResponse(200, "Order Cancelled Successfully", order));
});


// UNFINISHED
const updateOrder = asyncHandler(async (req, res) => {
    const OrderId = req.params._id
    const buyerId = req.user._id

    if (!(OrderId && buyerId)) {
        throw new APIError(400, "Something Went Wrong, Try Refresing Page");
    }

    const Order = await Order.findOneAndUpdate(
        {   _id: OrderId, 
            buyerId: buyerId,
            status: "pending" },
            req.body,
        { new: true }
    );

    if (!Order){
        throw new APIError(404, "Order Not Found or Can't be updated");
    }
    return res.status(200).json(new ApiResponse(200, "Order Updated Successfully", Order)); 
});

const raiseDispute = asyncHandler(async (req, res) => { });


// UNFINISHED
// PIPELINE LGEGI
const getOrdersByUser = asyncHandler(async (req, res) => {
    const buyerId = req.user._id;

    if (!buyerId) {
        throw new APIError(400, "Something Went Wrong, Try Refresing Page");
    }

    const orders = await Order.find({ buyerId: buyerId });
    return res.status(200).json(new ApiResponse(200, "Orders Fetched Successfully", orders));
 });

const getOrdersBySeller = asyncHandler(async (req, res) => {
    const SellerId = req.user._id

    if(!SellerId){
        throw new APIError(400,"Authentication Error",null)
    }

    const orders = await Order.findbyId({
        SellerId,
    })
    
    if(!orders){
        throw new APIError(404,"No Orders Found for this Seller",null)
    }
    req.status(200).json(new ApiResponse(200,"Orders Fetched Successfully",orders))
 });

// UNFINISHED
const HoldinEscrow = asyncHandler(async (req, res) => { });
//
const releaseEscrow = asyncHandler(async (req, res) => { });
//
const refundOrder = asyncHandler(async (req, res) => { });


const LogOrderAction = asyncHandler(async (req, res) => {
    const OrderId = req.params._id;
    const UserId = req.user._id;

    if(!(OrderId || UserId)){
        throw new APIError(400,"Authentication Error")
    }
    const Action = "Order Placed"
    const Auditlog = await Auditlog.Create({
        OrderId,
        UserId,
        Action,
        Amount : mongoose.Types.ObjectId(OrderId)
    })
    return res.status(201).json(new ApiResponse(201,"Order Action Logged Successfully",{}))
 });

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
    LogOrderAction,
}

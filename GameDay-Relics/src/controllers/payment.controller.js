import { APIError } from "../utils/Apierror.js";
import { stripe } from "../utils/stripe.js";
import { Order } from "../models/order.models.js";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createCheckoutSession_INTERNAL = async (buyerId, orderId) => {
  const buyer = await User.findById(buyerId);
  if (!buyer) throw new APIError(404, "Buyer not found");

  const order = await Order.findById(orderId).populate("productId");
  if (!order) throw new APIError(404, "Order not found");

  const item = order.productId;
  if (!item) throw new APIError(400, "No product linked to order");

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const priceInCents = Math.round(item.price * 100);
  const minimumAmount = 50;
  const finalAmount = Math.max(priceInCents, minimumAmount);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "pkr", 
          product_data: {
            name: item.title || "Item",
            description: item.description || "",
          },
          unit_amount: finalAmount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      orderId: order._id.toString(),
      buyerId: buyer._id.toString(),
    },
    success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/payment-cancelled?order_id=${order._id.toString()}`,
  });
  order.transactionId = session.id;
  await order.save();

  return session;
};
export const handlePaymentCancel = asyncHandler(async (req, res) => {
  const buyerId = req.user._id;

  if (!buyerId) {
    throw new APIError(400, "Buyer ID is required");
  }

  console.log(`[Payment Cancel] Processing cancellation for buyer: ${buyerId}`);

  const pendingOrders = await Order.find({
    buyerId,
    status: "pending"
  });

  console.log(`[Payment Cancel] Found ${pendingOrders.length} pending order(s) for buyer`);

  if (pendingOrders.length === 0) {
    console.log(`[Payment Cancel] No pending orders to cancel`);
    return res.status(200).json(new ApiResponse(200, "No pending order to cancel", null));
  }
  const deleteResult = await Order.deleteMany({
    buyerId,
    status: "pending"
  });

  console.log(`[Payment Cancel] Deleted ${deleteResult.deletedCount} order(s)`);

  res.status(200).json(new ApiResponse(200, `Payment cancelled and ${deleteResult.deletedCount} order(s) removed`, {
    deletedCount: deleteResult.deletedCount,
    orderIds: pendingOrders.map(o => o._id.toString())
  }));
});


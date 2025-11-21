// routes/payment.routes.js
import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createCheckoutSession_INTERNAL, handlePaymentCancel } from "../controllers/payment.controller.js";
import { stripe } from "../utils/stripe.js";
import { Order } from "../models/order.models.js";
import { APIError } from "../utils/Apierror.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/v1/payment/create-checkout-session
 * Body: { buyerId, orderId }
 * If you have auth middleware and want to use req.user._id, replace buyerId usage accordingly.
 */
router.post(
  "/create-checkout-session",
  asyncHandler(async (req, res) => {
    const { buyerId, orderId } = req.body;

    if (!buyerId || !orderId) {
      throw new APIError(400, "buyerId and orderId are required in body");
    }

    const session = await createCheckoutSession_INTERNAL(buyerId, orderId);
    // return the session url to frontend so it can redirect
    return res.status(200).json({ success: true, url: session.url, id: session.id });
  })
);

/**
 * GET /api/v1/payment/success?session_id=...
 * (Optional) Simple server-side confirmation after Stripe redirects the user back.
 * Note: This is less reliable than a webhook — but OK for quick testing.
 */
router.get(
  "/success",
  asyncHandler(async (req, res) => {
    const sessionId = req.query.session_id;
    if (!sessionId) throw new APIError(400, "session_id query param required");

    // retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // If Stripe returned metadata.orderId, use it; otherwise try to find order by transactionId
    const orderId = session?.metadata?.orderId;
    let order = null;

    if (orderId) {
      order = await Order.findById(orderId).populate("productId").populate("sellerId", "username email");
    } else {
      // fallback: find order whose transactionId equals sessionId
      order = await Order.findOne({ transactionId: sessionId }).populate("productId").populate("sellerId", "username email");
    }

    if (!order) {
      // still allow returning session info for debugging/testing
      return res.status(200).json({
        success: true,
        message: "Session retrieved but matching order not found. Check metadata or transactionId.",
        session,
      });
    }

    // mark order as paid/escrow if Stripe says it's paid
    if (session.payment_status === "paid") {
      order.status = "Escrow"; // or 'Completed' depending on your flow
      // ensure transactionId is stored (helps future lookups)
      order.transactionId = order.transactionId || session.id;
      await order.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified",
      order,
    });
  })
);

/**
 * GET /api/v1/payment/cancel
 * Show or return a cancellation notice (user cancelled payment on Stripe)
 */
router.get(
  "/cancel",
  asyncHandler(async (req, res) => {
    const sessionId = req.query.session_id;
    return res.status(200).json({
      success: false,
      message: "Payment canceled or not completed",
      sessionId: sessionId || null,
    });
  })
);

/**
 * POST /api/v1/payment/cancel-order
 * Authenticated endpoint to cancel/delete pending order when payment is cancelled
 * Requires: User authentication (buyerId from token)
 */
router.post(
  "/cancel-order",
  verifyJWT,
  handlePaymentCancel
);

export default router;

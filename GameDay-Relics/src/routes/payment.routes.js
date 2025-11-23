// routes/payment.routes.js
import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createCheckoutSession_INTERNAL,
  handlePaymentCancel,
  createStripeConnectLink,
  getStripeAccountStatus,
  disconnectStripeAccount,
} from "../controllers/payment.controller.js";
import { stripe } from "../utils/stripe.js";
import { Order } from "../models/order.models.js";
import { APIError } from "../utils/Apierror.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/create-checkout-session",
  asyncHandler(async (req, res) => {
    const { buyerId, orderId } = req.body;

    if (!buyerId || !orderId) {
      throw new APIError(400, "buyerId and orderId are required in body");
    }

    const session = await createCheckoutSession_INTERNAL(buyerId, orderId);
    return res.status(200).json({ success: true, url: session.url, id: session.id });
  })
);
router.get(
  "/success",
  asyncHandler(async (req, res) => {
    const sessionId = req.query.session_id;
    if (!sessionId) throw new APIError(400, "session_id query param required");
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session?.metadata?.orderId;
    let order = null;

    if (orderId) {
      order = await Order.findById(orderId).populate("productId").populate("sellerId", "username email");
    } else {
      order = await Order.findOne({ transactionId: sessionId }).populate("productId").populate("sellerId", "username email");
    }

    if (!order) {
      return res.status(200).json({
        success: true,
        message: "Session retrieved but matching order not found. Check metadata or transactionId.",
        session,
      });
    }

    if (session.payment_status === "paid") {
      order.status = "Escrow";
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

/**
 * Stripe Connect Endpoints for Seller Onboarding
 */

/**
 * POST /api/v1/payment/connect/create-link
 * Create Stripe Connect onboarding link for seller
 * Requires: Seller authentication
 */
router.post(
  "/connect/create-link",
  verifyJWT,
  createStripeConnectLink
);

/**
 * GET /api/v1/payment/connect/status
 * Get seller's Stripe account connection status
 * Requires: Seller authentication
 */
router.get(
  "/connect/status",
  verifyJWT,
  getStripeAccountStatus
);

/**
 * POST /api/v1/payment/connect/disconnect
 * Disconnect seller's Stripe account
 * Requires: Seller authentication
 */
router.post(
  "/connect/disconnect",
  verifyJWT,
  disconnectStripeAccount
);

export default router;

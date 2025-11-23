import { APIError } from "../utils/Apierror.js";
import { stripe } from "../utils/stripe.js";
import { Order } from "../models/order.models.js";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create or update Stripe Connect onboarding link for seller
export const createStripeConnectLink = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  
  // Verify user is a seller
  if (req.user.role !== "seller") {
    throw new APIError(403, "Only sellers can connect Stripe accounts");
  }

  const seller = await User.findById(sellerId);
  if (!seller) {
    throw new APIError(404, "Seller not found");
  }

  try {
    // Ensure paymentDetails object exists
    if (!seller.paymentDetails) {
      seller.paymentDetails = {};
    }

    let connectedAccountId = seller.paymentDetails.stripeConnectedAccountId;

    // Create new connected account if it doesn't exist
    if (!connectedAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "PK",
        email: seller.email,
        business_profile: {
          mcc: "5734", // Software stores MCC
          url: process.env.FRONTEND_URL || "http://localhost:5173",
        },
      });
      connectedAccountId = account.id;
      seller.paymentDetails.stripeConnectedAccountId = connectedAccountId;
      console.log(`[Stripe Connect] Created new account ${connectedAccountId} for seller ${sellerId}`);
    }

    // Generate account onboarding link
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const accountLink = await stripe.accountLinks.create({
      account: connectedAccountId,
      type: "account_onboarding",
      refresh_url: `${frontendUrl}/payment-settings?refresh=true`,
      return_url: `${frontendUrl}/payment-settings?success=true`,
    });

    seller.paymentDetails.stripeOnboardingUrl = accountLink.url;
    seller.paymentDetails.stripeOnboardingStatus = "pending";
    await seller.save();

    console.log(`[Stripe Connect] Generated onboarding link for seller ${sellerId}`);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Stripe onboarding link created successfully",
          { url: accountLink.url }
        )
      );
  } catch (error) {
    console.error("[Stripe Connect Error]", error);
    throw new APIError(
      500,
      `Failed to create Stripe Connect link: ${error.message}`
    );
  }
});

// Check Stripe account onboarding status
export const getStripeAccountStatus = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  const seller = await User.findById(sellerId);
  if (!seller) {
    throw new APIError(404, "Seller not found");
  }

  // Ensure paymentDetails object exists
  if (!seller.paymentDetails) {
    seller.paymentDetails = {};
  }

  const connectedAccountId = seller.paymentDetails.stripeConnectedAccountId;
  if (!connectedAccountId) {
    console.log(`[Stripe Status] No connected account for seller ${sellerId}`);
    return res
      .status(200)
      .json(
        new ApiResponse(200, "No connected account", {
          status: "not_connected",
          url: null,
        })
      );
  }

  try {
    const account = await stripe.accounts.retrieve(connectedAccountId);

    // Check if charges are enabled (account is verified)
    const isVerified = account.charges_enabled;
    const status = isVerified ? "completed" : "pending";

    if (isVerified) {
      seller.paymentDetails.stripeOnboardingStatus = "completed";
      await seller.save();
      console.log(`[Stripe Status] Account ${connectedAccountId} verified for seller ${sellerId}`);
    }

    console.log(`[Stripe Status] Account ${connectedAccountId} status: ${status}, charges_enabled: ${account.charges_enabled}, payouts_enabled: ${account.payouts_enabled}`);

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Account status retrieved", {
          status,
          accountId: connectedAccountId,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          requirements: account.requirements?.currently_due || [],
        })
      );
  } catch (error) {
    console.error("[Stripe Account Status Error]", error);
    throw new APIError(500, `Failed to retrieve account status: ${error.message}`);
  }
});

// Disconnect Stripe account
export const disconnectStripeAccount = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  const seller = await User.findById(sellerId);
  if (!seller) {
    throw new APIError(404, "Seller not found");
  }

  // Ensure paymentDetails object exists
  if (!seller.paymentDetails) {
    seller.paymentDetails = {};
  }

  const connectedAccountId = seller.paymentDetails.stripeConnectedAccountId;
  if (!connectedAccountId) {
    throw new APIError(400, "No connected Stripe account to disconnect");
  }

  try {
    // Revoke authorization to disconnect
    await stripe.oauth.deauthorize({
      client_id: process.env.STRIPE_CLIENT_ID,
      stripe_user_id: connectedAccountId,
    });

    seller.paymentDetails.stripeConnectedAccountId = null;
    seller.paymentDetails.stripeOnboardingStatus = "pending";
    seller.paymentDetails.stripeOnboardingUrl = null;
    await seller.save();

    console.log(`[Stripe Disconnect] Disconnected account ${connectedAccountId} for seller ${sellerId}`);

    return res
      .status(200)
      .json(new ApiResponse(200, "Stripe account disconnected successfully"));
  } catch (error) {
    console.error("[Stripe Disconnect Error]", error);
    throw new APIError(500, `Failed to disconnect account: ${error.message}`);
  }
});

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


import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/Apierror.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { Product } from "../models/product.models.js";
import { Order } from "../models/order.models.js";
import { Auditlog } from "../models/auditlog.models.js";
import { Dispute } from "../models/dispute.models.js";
import { stripe } from "../utils/stripe.js";

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
  const users = await User.find({ role: { $exists: true, $ne: null } }).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users Fetched Successfully"));
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
    amount: stats[0]?.totalAmount || 0,
    userId: adminid,
  });

  if (!auditlog) {
    throw new APIError(400, "Audits Issue Caused in Stats Retrieval");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, stats[0] || null, "Order Amount Stats Fetched Successfully")
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
  const Orders = await Order.find()
    .populate("productId", "title price")
    .populate("buyerId", "username email")
    .populate("sellerId", "username email")
    .sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, Orders, "All Orders Fetched Successfully"));
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

  // If user is a seller, handle product deletion
  if (checkUser.role === "seller") {
    const productsbyassociatedseller = await Product.find({ sellerId: userIdToDelete });
    const productIds = productsbyassociatedseller.map(product => product._id);

    if (productIds.length > 0) {
      const productvalidation = await Order.find({ productId: { $in: productIds } });
      const productIdsWithOrders = productvalidation.map(order => order.productId.toString());
      const productIdsWithoutOrders = productIds.filter(id => !productIdsWithOrders.includes(id.toString()));
      if (productIdsWithoutOrders.length > 0) {
        await Product.deleteMany({ _id: { $in: productIdsWithoutOrders } });
      }
      if (productIdsWithOrders.length > 0) {
        throw new APIError(400, `Cannot Delete Seller: ${productIdsWithOrders.length} product(s) have active orders. Deleted ${productIdsWithoutOrders.length} product(s) without orders.`);
      }
    }
  }

  const deleteduser = await User.findByIdAndDelete(checkUser._id);

  if (!deleteduser) {
    throw new APIError(400, "Cannot Delete User");
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
    .json(new ApiResponse(200, deleteduser, "User Deleted Successfully"));
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


const removeProduct = asyncHandler(async (req, res) => {
  const adminId = req.user._id
  const productId = req.params.id

  if (!adminId) {
    throw new APIError(400, "Admin Id Authentication Error")
  }
  if (!productId) {
    throw new APIError(400, "Product Id is invalid")
  }

  const productnotordered = await Order.findById(productId).select("Escrow Held Disputed ")
  if (productnotordered.tostring() === "Escrow" || productnotordered.tostring() === "Held" || productnotordered.tostring() === "Disputed") {
    throw new APIError(400, "Can't Delete Product if its ordered and order is in progress")
  }

  const producttodelete = await Product.findByIdAndDelete(productId)

  if (!producttodelete) {
    throw new APIError(400, "Product doesn't Exist or Deletion Failed")
  }

  const auditl = await Auditlog.create({
    userId: adminId,
    action: "Force Product Deletion",
    //amount: producttodelete.amount,
  });

  if (!auditl) {
    throw new APIError(400, "Audit Creation Failed for Raising Dispute ")
  }
  res.status(200).json(200, new ApiResponse(200, "Forced Product Deleted"))
});

const forceRefund = asyncHandler(async (req, res) => { });

// Get all escrow payments (orders in escrow status)
const getEscrowPayments = asyncHandler(async (req, res) => {
  const adminId = req.user._id;

  if (!adminId) {
    throw new APIError(400, "Authentication Error");
  }

  const adminCheck = await User.findById(adminId);
  if (!adminCheck || adminCheck.role !== "admin") {
    throw new APIError(403, "Unauthorized: Admin access required");
  }

  // Find all orders that are in escrow status (including in_transit where seller confirmed delivery)
  const escrowOrders = await Order.find({
    status: { $in: ["Escrow", "Held", "shipped", "in_transit"] },
    escrowRelease: false
  })
    .populate("productId", "title")
    .populate("buyerId", "username email")
    .populate("sellerId", "username email paymentGateway paymentDetails activePaymentMethod")
    .sort({ createdAt: -1 });

  // Transform to match frontend expected format
  const escrowPayments = escrowOrders.map(order => {
    const seller = order.sellerId;
    const activeMethod = seller?.activePaymentMethod;

    // Filter payment info based on active method
    let paymentGateway = null;
    let paymentDetails = null;

    if (activeMethod === 'stripe' && seller?.paymentDetails?.stripeConnectedAccountId) {
      // Show only Stripe details
      paymentGateway = 'stripe';
      paymentDetails = {
        stripeConnectedAccountId: seller.paymentDetails.stripeConnectedAccountId,
        stripeAccountType: seller.paymentDetails.stripeAccountType,
        stripeOnboardingStatus: seller.paymentDetails.stripeOnboardingStatus
      };
    } else if (activeMethod === 'manual' && seller?.paymentGateway && seller?.paymentDetails?.accountNumber) {
      // Show only manual payment details
      paymentGateway = seller.paymentGateway;
      paymentDetails = {
        accountNumber: seller.paymentDetails.accountNumber,
        accountName: seller.paymentDetails.accountName
      };
    }

    return {
      id: order._id.toString(),
      order_id: order._id.toString(),
      amount: order.amount,
      status: 'held',
      held_at: order.createdAt,
      buyerSatisfaction: order.buyerSatisfaction || 'pending',
      seller: {
        id: seller?._id?.toString(),
        username: seller?.username,
        email: seller?.email,
        paymentGateway,
        paymentDetails,
        activePaymentMethod: activeMethod
      },
      order: {
        id: order._id.toString(),
        buyer_id: order.buyerId?._id?.toString(),
        seller_id: seller?._id?.toString(),
        product_id: order.productId?._id?.toString(),
        price: order.amount,
        status: order.status
      }
    };
  });

  return res.status(200).json(
    new ApiResponse(200, escrowPayments, "Escrow payments fetched successfully")
  );
});

// Release escrow payment
const releaseEscrowPayment = asyncHandler(async (req, res) => {
  const adminId = req.user._id;
  const { orderId } = req.body;
  const escrowId = req.params.escrowId;

  if (!adminId) {
    throw new APIError(400, "Authentication Error");
  }

  const adminCheck = await User.findById(adminId);
  if (!adminCheck || adminCheck.role !== "admin") {
    throw new APIError(403, "Unauthorized: Admin access required");
  }

  // Use orderId from body or escrowId from params (they should be the same)
  const orderIdToUse = orderId || escrowId;

  const order = await Order.findById(orderIdToUse);
  if (!order) {
    throw new APIError(404, "Order not found");
  }

  if (order.escrowRelease) {
    throw new APIError(400, "Escrow already released");
  }

  // Get seller payment information
  const seller = await User.findById(order.sellerId).select("paymentGateway paymentDetails username email");
  if (!seller) {
    throw new APIError(404, "Seller not found");
  }

  // Release escrow
  order.escrowRelease = true;
  order.status = "Completed";
  order.payoutStatus = "pending";
  order.payoutInitiatedAt = new Date();

  // Check if seller has Stripe connected account
  const connectedAccountId = seller.paymentDetails?.stripeConnectedAccountId;

  if (connectedAccountId) {
    // Automated transfer via Stripe Connected Account
    const isTestMode = process.env.NODE_ENV !== 'production' || process.env.STRIPE_SECRET_KEY?.includes('_test_');

    try {
      if (isTestMode) {
        // In test mode, skip actual Stripe transfer (no balance available)
        // Just mark as released and simulate success
        console.log(`[Test Mode] Skipping Stripe transfer for order ${order._id}, amount: ${order.amount}`);

        order.transferId = `test_transfer_${Date.now()}`;
        order.payoutStatus = "succeeded";
        order.payoutCompletedAt = new Date();
        order.escrowRelease = true;
        order.status = "Completed"; // Note: Capital C to match enum

        // Create audit log
        await Auditlog.create({
          action: `Escrow Released (Test Mode - Stripe) - Order ${order._id}`,
          amount: order.amount,
          sellerId: order.sellerId,
          userId: adminId,
        });

        await order.save();

        return res.status(200).json(
          new ApiResponse(200, {
            order,
            paymentMethod: "stripe_connected_account",
            testMode: true,
            message: "Test mode: Order marked as released without actual Stripe transfer"
          }, "Escrow released successfully (Test Mode)")
        );
      } else {
        // Production mode: Actual Stripe transfer
        const transfer = await stripe.transfers.create({
          amount: Math.round(order.amount * 100), // Amount in cents
          currency: "pkr",
          destination: connectedAccountId,
          metadata: {
            orderId: order._id.toString(),
            sellerId: seller._id.toString(),
          },
          description: `Payment for order ${order._id}`,
        });

        order.transferId = transfer.id;
        order.payoutStatus = "succeeded";
        order.payoutCompletedAt = new Date();

        // Create audit log for automated transfer
        await Auditlog.create({
          action: `Automated Stripe Transfer - Order ${order._id}`,
          amount: order.amount,
          sellerId: order.sellerId,
          userId: adminId,
        });

        await order.save();

        return res.status(200).json(
          new ApiResponse(200, {
            order,
            paymentMethod: "stripe_connected_account",
            transfer: {
              id: transfer.id,
              amount: transfer.amount / 100,
              status: transfer.status,
            },
          }, "Escrow payment transferred successfully via Stripe Connect")
        );
      }
    } catch (stripeError) {
      console.error("[Stripe Transfer Error]", stripeError);
      // Fall back to manual payment if transfer fails
      order.payoutStatus = "failed";
      await order.save();
      throw new APIError(500, `Stripe transfer failed: ${stripeError.message}`);
    }
  } else {
    // Manual payment fallback (seller hasn't connected Stripe account)
    if (!seller.paymentGateway) {
      throw new APIError(400, "Seller has not configured payment settings. Cannot release escrow.");
    }

    // Create audit log with payment gateway info
    await Auditlog.create({
      action: `Escrow Released - Manual Payment to ${seller.paymentGateway}`,
      amount: order.amount,
      sellerId: order.sellerId,
      userId: adminId,
    });

    await order.save();

    // Return order with seller payment details for admin to process payment manually
    const responseData = {
      order,
      paymentMethod: "manual",
      sellerPaymentInfo: {
        sellerId: seller._id,
        sellerName: seller.username,
        sellerEmail: seller.email,
        paymentGateway: seller.paymentGateway,
        paymentDetails: seller.paymentDetails,
        amount: order.amount,
      }
    };

    return res.status(200).json(
      new ApiResponse(200, responseData, "Escrow payment released for manual processing. Please process payment to seller using the provided payment details.")
    );
  }
});

// Get all disputes
const getAllDisputes = asyncHandler(async (req, res) => {
  const adminId = req.user._id;

  if (!adminId) {
    throw new APIError(400, "Authentication Error");
  }

  const adminCheck = await User.findById(adminId);
  if (!adminCheck || adminCheck.role !== "admin") {
    throw new APIError(403, "Unauthorized: Admin access required");
  }

  // Find all open disputes
  const disputes = await Dispute.find({ status: "Open" })
    .populate("orderId")
    .populate("buyerId", "username email")
    .sort({ createdAt: -1 });

  // Transform to match frontend expected format
  const formattedDisputes = disputes.map(dispute => ({
    id: dispute._id.toString(),
    order_id: dispute.orderId?._id?.toString(),
    raised_by: dispute.buyerId?._id?.toString(),
    reason: dispute.reason,
    description: dispute.description,
    status: dispute.status.toLowerCase(),
    created_at: dispute.createdAt,
    order: dispute.orderId ? {
      id: dispute.orderId._id.toString(),
      status: dispute.orderId.status,
      amount: dispute.orderId.amount
    } : null
  }));

  return res.status(200).json(
    new ApiResponse(200, formattedDisputes, "Disputes fetched successfully")
  );
});

// Get full dispute details with all information for admin viewing
const getDisputeDetails = asyncHandler(async (req, res) => {
  const adminId = req.user._id;
  const disputeId = req.params.disputeId;

  if (!adminId) {
    throw new APIError(400, "Authentication Error");
  }

  const adminCheck = await User.findById(adminId);
  if (!adminCheck || adminCheck.role !== "admin") {
    throw new APIError(403, "Unauthorized: Admin access required");
  }

  const dispute = await Dispute.findById(disputeId)
    .populate("orderId")
    .populate("buyerId", "username email paymentDetails")
    .populate("sellerId", "username email paymentGateway paymentDetails");

  if (!dispute) {
    throw new APIError(404, "Dispute not found");
  }

  // Format the response with all necessary details
  const formattedDispute = {
    id: dispute._id.toString(),
    reason: dispute.reason,
    description: dispute.description,
    status: dispute.status,
    resolution: dispute.resolution,
    evidence: dispute.evidence || [],
    createdAt: dispute.createdAt,
    resolvedAt: dispute.resolvedAt,
    order: dispute.orderId ? {
      id: dispute.orderId._id.toString(),
      productId: dispute.orderId.productId,
      status: dispute.orderId.status,
      amount: dispute.orderId.amount,
      transactionId: dispute.orderId.transactionId,
      createdAt: dispute.orderId.createdAt,
    } : null,
    buyer: dispute.buyerId ? {
      id: dispute.buyerId._id.toString(),
      username: dispute.buyerId.username,
      email: dispute.buyerId.email,
    } : null,
    seller: dispute.sellerId ? {
      id: dispute.sellerId._id.toString(),
      username: dispute.sellerId.username,
      email: dispute.sellerId.email,
      paymentGateway: dispute.sellerId.paymentGateway,
      paymentDetails: dispute.sellerId.paymentDetails,
    } : null,
  };

  return res.status(200).json(
    new ApiResponse(200, formattedDispute, "Dispute details fetched successfully")
  );
});

// Process refund for a dispute - refund to buyer with resolution notes
const processDisputeRefund = asyncHandler(async (req, res) => {
  const adminId = req.user._id;
  const disputeId = req.params.disputeId;
  const { resolution } = req.body;

  if (!adminId) {
    throw new APIError(400, "Authentication Error");
  }

  const adminCheck = await User.findById(adminId);
  if (!adminCheck || adminCheck.role !== "admin") {
    throw new APIError(403, "Unauthorized: Admin access required");
  }

  if (!resolution || !resolution.trim()) {
    throw new APIError(400, "Resolution notes are required");
  }

  const dispute = await Dispute.findById(disputeId)
    .populate("orderId")
    .populate("buyerId", "username email paymentDetails")
    .populate("sellerId", "username email paymentGateway paymentDetails");

  if (!dispute) {
    throw new APIError(404, "Dispute not found");
  }

  const order = dispute.orderId;
  if (!order) {
    throw new APIError(400, "Order associated with dispute not found");
  }

  const buyer = dispute.buyerId;
  const seller = dispute.sellerId;

  if (!buyer) {
    throw new APIError(400, "Buyer information not found");
  }

  if (!seller) {
    throw new APIError(400, "Seller information not found");
  }

  // Update order status to Refunded
  order.status = "Refunded";
  await order.save();

  // Update dispute status to Resolved with refund resolution
  dispute.status = "Resolved";
  dispute.resolution = resolution;
  dispute.resolvedAt = new Date();
  dispute.resolvedBy = adminId;
  await dispute.save();

  // Create audit log
  await Auditlog.create({
    action: "Dispute Resolved - Refund to Buyer",
    userId: adminId,
    amount: order.amount,
    sellerId: seller._id,
  });

  const refundInfo = {
    disputeId: dispute._id.toString(),
    orderId: order._id.toString(),
    amount: order.amount,
    action: "refund_buyer",
    resolution: resolution,
    timestamp: new Date(),
  };

  return res.status(200).json(
    new ApiResponse(200, refundInfo, "Dispute resolved - Refund processed to buyer.")
  );
});





// Release escrow for a dispute - release payment to seller with resolution notes
const releaseEscrowForDispute = asyncHandler(async (req, res) => {
  const adminId = req.user._id;
  const disputeId = req.params.disputeId;
  const { resolution } = req.body;

  if (!adminId) {
    throw new APIError(400, "Authentication Error");
  }

  const adminCheck = await User.findById(adminId);
  if (!adminCheck || adminCheck.role !== "admin") {
    throw new APIError(403, "Unauthorized: Admin access required");
  }

  if (!resolution || !resolution.trim()) {
    throw new APIError(400, "Resolution notes are required");
  }

  const dispute = await Dispute.findById(disputeId)
    .populate("orderId")
    .populate("buyerId", "username email")
    .populate("sellerId", "username email paymentGateway paymentDetails");

  if (!dispute) {
    throw new APIError(404, "Dispute not found");
  }

  const order = dispute.orderId;
  if (!order) {
    throw new APIError(400, "Order associated with dispute not found");
  }

  const seller = dispute.sellerId;

  if (!seller) {
    throw new APIError(400, "Seller information not found");
  }

  // Check if seller has configured payment settings
  if (!seller.paymentGateway) {
    throw new APIError(400, "Seller has not configured payment settings. Cannot release escrow.");
  }

  // Release escrow - set escrowRelease to true and status to Completed
  order.escrowRelease = true;
  order.status = "Completed";
  await order.save();

  // Update dispute status to Resolved with escrow release resolution
  dispute.status = "Resolved";
  dispute.resolution = resolution;
  dispute.resolvedAt = new Date();
  dispute.resolvedBy = adminId;
  await dispute.save();

  // Create audit log
  await Auditlog.create({
    action: `Dispute Resolved - Escrow Released to ${seller.paymentGateway}`,
    userId: adminId,
    amount: order.amount,
    sellerId: seller._id,
  });

  const responseData = {
    disputeId: dispute._id.toString(),
    orderId: order._id.toString(),
    amount: order.amount,
    action: "release_seller",
    resolution: resolution,
    sellerPaymentInfo: {
      sellerId: seller._id,
      sellerName: seller.username,
      sellerEmail: seller.email,
      paymentGateway: seller.paymentGateway,
      paymentDetails: seller.paymentDetails,
    },
    timestamp: new Date(),
  };

  return res.status(200).json(
    new ApiResponse(200, responseData, "Dispute resolved - Escrow released to seller.")
  );
});

// Resolve dispute
const resolveDispute = asyncHandler(async (req, res) => {
  const adminId = req.user._id;
  const disputeId = req.params.disputeId;
  const { resolution, orderId } = req.body;

  if (!adminId) {
    throw new APIError(400, "Authentication Error");
  }

  const adminCheck = await User.findById(adminId);
  if (!adminCheck || adminCheck.role !== "admin") {
    throw new APIError(403, "Unauthorized: Admin access required");
  }

  if (!resolution || !resolution.trim()) {
    throw new APIError(400, "Resolution description is required");
  }

  const dispute = await Dispute.findById(disputeId);
  if (!dispute) {
    throw new APIError(404, "Dispute not found");
  }

  if (dispute.status !== "Open") {
    throw new APIError(400, "Dispute is already resolved");
  }

  // Update dispute status
  dispute.status = "Resolved";
  dispute.resolution = resolution;
  dispute.resolvedAt = new Date();
  dispute.resolvedBy = adminId;
  await dispute.save();

  // Create audit log
  await Auditlog.create({
    action: "Dispute Resolved",
    userId: adminId,
    amount: dispute.orderId?.amount || 0,
  });

  return res.status(200).json(
    new ApiResponse(200, dispute, "Dispute resolved successfully")
  );
});

// Get all audit logs with pagination
const getAllAuditLogs = asyncHandler(async (req, res) => {
  const adminId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!adminId) {
    throw new APIError(400, "Authentication Error, Try Refreshing Page");
  }

  const admincheck = await User.findById(adminId);
  if (!admincheck || admincheck.role !== "admin") {
    throw new APIError(403, "Unauthorized: Admin access required");
  }

  try {
    const totalAuditLogs = await Auditlog.countDocuments();

    const auditLogs = await Auditlog.find()
      .populate("userId", "username email role")
      .populate("sellerId", "username email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalAuditLogs / limit);

    const formattedLogs = auditLogs.map(log => ({
      _id: log._id,
      action: log.action || "null",
      amount: log.amount || "null",
      sellerId: log.sellerId ? {
        _id: log.sellerId._id,
        username: log.sellerId.username,
        email: log.sellerId.email,
        role: log.sellerId.role
      } : "null",
      userId: log.userId ? {
        _id: log.userId._id,
        username: log.userId.username,
        email: log.userId.email,
        role: log.userId.role
      } : "null",
      createdAt: log.createdAt || "null",
      updatedAt: log.updatedAt || "null"
    }));

    return res.status(200).json(
      new ApiResponse(200, {
        auditLogs: formattedLogs,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalLogs: totalAuditLogs,
          logsPerPage: limit
        }
      }, "Audit logs retrieved successfully")
    );
  } catch (error) {
    throw new APIError(500, `Error retrieving audit logs: ${error.message}`);
  }
});

// Check Stripe transfer status and update order if needed
const checkTransferStatus = asyncHandler(async (req, res) => {
  const adminId = req.user._id;
  const { orderId } = req.params;

  if (!adminId) {
    throw new APIError(400, "Authentication Error");
  }

  const adminCheck = await User.findById(adminId);
  if (!adminCheck || adminCheck.role !== "admin") {
    throw new APIError(403, "Unauthorized: Admin access required");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new APIError(404, "Order not found");
  }

  if (!order.transferId) {
    throw new APIError(400, "No Stripe transfer associated with this order");
  }

  try {
    const transfer = await stripe.transfers.retrieve(order.transferId);

    // Update order status based on transfer status
    if (transfer.status === "succeeded" && order.payoutStatus !== "succeeded") {
      order.payoutStatus = "succeeded";
      order.payoutCompletedAt = new Date();
      await order.save();
    } else if (transfer.status === "failed" && order.payoutStatus !== "failed") {
      order.payoutStatus = "failed";
      await order.save();
    }

    return res.status(200).json(
      new ApiResponse(200, {
        transfer: {
          id: transfer.id,
          amount: transfer.amount / 100,
          currency: transfer.currency,
          status: transfer.status,
          created: transfer.created,
          destination: transfer.destination,
        },
        orderPayoutStatus: order.payoutStatus,
      }, "Transfer status retrieved successfully")
    );
  } catch (error) {
    console.error("[Check Transfer Status Error]", error);
    throw new APIError(500, `Failed to check transfer status: ${error.message}`);
  }
});

export {
  forceCancelOrder,
  getAllUsers,
  getAllOrders,
  getOrderAmountStats,
  forcedDeleteUser,
  solveDispute,
  removeProduct,
  getEscrowPayments,
  releaseEscrowPayment,
  getAllDisputes,
  getDisputeDetails,
  processDisputeRefund,
  releaseEscrowForDispute,
  resolveDispute,
  getAllAuditLogs,
  checkTransferStatus
};

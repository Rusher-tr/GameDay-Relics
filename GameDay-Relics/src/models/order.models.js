import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    transactionId: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "Escrow",
        "Held",
        "shipped",
        "in_transit",
        "Completed",
        "Disputed",
        "Refunded",
        "Cancelled",
      ],
      default: "pending",
    },
    amount: {
      type: Number,
      required: true,
    },
    escrowRelease: {
      type: Boolean,
      default: false,
    },
    buyerSatisfaction: {
      type: String,
      enum: ["pending", "satisfied", "fine", "disputed"],
      default: "pending",
    },
    deliveryGatewayOptions: {
      type: [String],
      enum: ["DHL", "FedEx", "TCS", "Leopard", "M&P"],
      default: [],
    },
    deliveryGatewaySelected: {
      type: String,
      enum: ["DHL", "FedEx", "TCS", "Leopard", "M&P", null],
      default: null,
    },
    shippingProvider: {
      type: String,
    },
    trackingNumber: {
      type: String,
    },
    sellerDeliveryConfirmed: {
      type: Date,
      default: null,
    },
    sellerConfirmationDeadline: {
      type: Date,
      default: null,
    },
    cancelledReason: {
      type: String,
      default: null,
    },
    autoSatisfactionDate: {
      type: Date,
      default: null,
    },
    transferId: {
      type: String,
      default: null,
    },
    payoutStatus: {
      type: String,
      enum: ["pending", "succeeded", "failed"],
      default: "pending",
    },
    payoutInitiatedAt: {
      type: Date,
      default: null,
    },
    payoutCompletedAt: {
      type: Date,
      default: null,
    },
    shippingAddress: {
      type: {
        street: String,
        city: String,
        postalCode: String,
        country: String,
      },
      default: {},
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);

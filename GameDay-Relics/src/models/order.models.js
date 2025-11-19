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
        "Completed",
        "Disputed",
        "Refunded",
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
    shippingProvider: {
      type: String,
    },
    trackingNumber: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);

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
        type: String, // or Schema.Types.ObjectId if you want to store a reference later
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

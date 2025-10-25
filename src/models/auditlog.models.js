import mongoose, { Schema } from "mongoose";

const auditlogSchema = new Schema(
  {
    action: {
      type: String,
    },
    paymentMethod: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const auditlog = mongoose.mondel("Auditlog", auditlogSchema);

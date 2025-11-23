import mongoose, { Schema } from "mongoose";

const auditlogSchema = new Schema(
  {
    action: {
      type: String,
    },
    amount: {
      type: Number,
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

export const Auditlog = mongoose.model("Auditlog", auditlogSchema);

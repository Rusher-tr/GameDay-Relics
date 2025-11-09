import mongoose, { Schema } from "mongoose";

const disputeSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedBy:{
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Open", "Resolved", "In review", "Refunded"],
      default: "pending",
    },
    evidence:{
         type: [String]
    },
    inpsectionProvider:{
        type:String,
    },
    inpsectionCertificationId:{
        type:String,
    },
    inpsectionUrl:{
        type:String,
    },
  },
  { timestamps: true }
);

export const Dispute = mongoose.model("Dispute", disputeSchema);

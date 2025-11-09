import mongoose, { Schema } from "mongoose";

const verificationSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    verified: {
      type: Boolean,
    },
    verificationBy: {
      type: String,
    },
    verificationId: {
      type: String,
    },
    certificationBy: {
      type: String,
    },
    certificationId: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Verification = mongoose.model("Verification", verificationSchema);

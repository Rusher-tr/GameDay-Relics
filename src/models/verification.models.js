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
      type: string,
    },
    verificationId: {
      type: string,
    },
    certificationBy: {
      type: string,
    },
    certificationId: {
      type: string,
    },
    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const verification = mongoose.mondel("Verification", verificationSchema);

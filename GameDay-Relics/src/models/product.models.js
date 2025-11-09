import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    condition: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationId: {
      type: Schema.Types.ObjectId,
      ref: "Verification",
    },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);

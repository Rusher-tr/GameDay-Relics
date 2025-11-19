import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String, 
    },

    role: {
      type: String,
      enum: ["admin", "buyer", "seller"],
      required: true,
      default: "buyer",
    },
    paymentGateway: {
      type: String,
      enum: ["nayapay", "easypaisa", "jazzcash", "stripe"],
    },
    paymentDetails: {
      accountNumber: String, 
      accountName: String,
      stripeAccountId: String, 
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); 

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordcorrect = async function (Password) {
  return await bcrypt.compare(Password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, username: this.username },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export const User = mongoose.model("User", userSchema);

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/Apierror.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
  if ([email, username, password].some((field) => !field || field.trim() === "")) {
    throw new APIError(400, "Email, username, and password are required");
  }
  if (role && role.trim() === "") {
    throw new APIError(400, "Role cannot be empty if provided");
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });


  if (existedUser) {
    throw new APIError(409, "email or username already exists");
  }

  const user = await User.create({
    email,
    password,
    username,
    role,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new APIError(500, "Something Went wrong in user registration");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const generateAccessandRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (err) {
    throw new APIError(
      500,
      "Something went wrong with access or refresh token"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {

  const { email, username, password } = req.body;


  if (!(username || email)) {
    throw new APIError(400, "Username or email is required");
  }


  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new APIError(404, "User doesn't exist, Register yourself first");
  }


  const isPasswordvalid = await user.isPasswordcorrect(password);

  if (!isPasswordvalid) {
    throw new APIError(401, "Incorrect Password");
  }


  const { accessToken, refreshToken } = await generateAccessandRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged in Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {

  await User.findByIdAndUpdate(

    req.user._id,
    {
      $set: { refreshToken: null },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

// UNFINISHED || causing issues
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new APIError(401, "Unauthorized Request Access");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new APIError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new APIError(401, "Refresh Token is expired");
    }
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    };
    const { accessToken, refreshToken } =
      await generateAccessandRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token Refreshed"
        )
      );
  } catch (err) {
    throw new APIError(401, err?.message, "Refresh token Verification Failed");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordcorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new APIError(400, "Old Password Invalid");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "Password Changed"));
});

const getCurrentUser = asyncHandler(async (req, res) => {

  if (!req.user) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, null, "No authenticated user")
      );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, req.user, "Current User Fetched Successfully")
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { username, email } = req.body;

  if (!(username || email)) {
    throw new APIError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        username: username,
        email: email,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User Information Updated Successfully"));
});

const updatePaymentSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { paymentGateway, accountNumber, accountName, stripeAccountId } = req.body;

  if (!userId) {
    throw new APIError(400, "Authentication Error");
  }

  const user = await User.findById(userId);
  if (!user || user.role !== "seller") {
    throw new APIError(403, "Only sellers can update payment settings");
  }

  const validGateways = ["nayapay", "easypaisa", "jazzcash", "stripe"];
  if (paymentGateway && !validGateways.includes(paymentGateway)) {
    throw new APIError(400, "Invalid payment gateway. Must be one of: nayapay, easypaisa, jazzcash, stripe");
  }

  if (paymentGateway) {
    if (paymentGateway === "stripe") {
      if (!stripeAccountId || !stripeAccountId.trim()) {
        throw new APIError(400, "Stripe Account ID is required for Stripe gateway");
      }
    } else {
      if (!accountNumber || !accountNumber.trim()) {
        throw new APIError(400, "Account number is required for mobile wallet gateways");
      }
      if (!accountName || !accountName.trim()) {
        throw new APIError(400, "Account name is required for mobile wallet gateways");
      }
    }
  }

  user.paymentGateway = paymentGateway;
  user.paymentDetails = {
    accountNumber: accountNumber || user.paymentDetails?.accountNumber,
    accountName: accountName || user.paymentDetails?.accountName,
    stripeAccountId: stripeAccountId || user.paymentDetails?.stripeAccountId,
  };
  user.activePaymentMethod = "manual"; // Set manual as active

  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(userId).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Payment settings updated successfully"));
});

const getPaymentSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    throw new APIError(400, "Authentication Error");
  }

  const user = await User.findById(userId).select("role paymentGateway paymentDetails");
  if (!user) {
    throw new APIError(404, "User not found");
  }

  if (user.role !== "seller") {
    throw new APIError(403, "Only sellers can view payment settings");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {
      paymentGateway: user.paymentGateway,
      paymentDetails: user.paymentDetails
    }, "Payment settings fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updatePaymentSettings,
  getPaymentSettings,
  generateAccessandRefreshTokens,
};

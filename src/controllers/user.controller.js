import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/Apierror.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const registerUser = asyncHandler(async (req, res) => {
  // get user details
  const {  email, username, password , role } = req.body;
  //console.log(email)

  // validate data

  // bellow given will check if any one of the fields provided is null or not by some method
  // this some method will take arguments and check each element in array and returns T/F

  if (
    [email, username, password, role].some((field) => field?.trim() === "")
  ) {
    throw new APIError(400, "All fields are required");
  }

  // existing user check

  const existedUser = await User.findOne({
    $or: [{ username }, { email } ,{ role }],
  });

  if (existedUser) {
    throw new APIError(409, "email or username already exists");
  }

  // create user object and create mongo entry

  const user = await User.create({
    email,
    password,
    username,
    role: "buyer", // by default role is buyer
  });

  // remove password and refresh token field from response

  // we dont want to give response of password and refresh token to frontend so
  // we use select method to filter out those items when validating if user is created
  // or not in DB by user id

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check if the user is created or not

  if (!createdUser) {
    throw new APIError(500, "Something Went wrong in user registration");
  }

  // return response else return error

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
  // req body -> data

  const { email, username, password } = req.body;

  // validate username, email

  if (!(username || email)) {
    throw new APIError(400, "Username or email is required");
  }

  // find if user exist or not

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new APIError(404, "User doesn't exist, Register yourself first");
  }
  
  // if user exists check pass

  const isPasswordvalid = await user.isPasswordcorrect(password);

  if (!isPasswordvalid) {
    throw new APIError(401, "Incorrect Password");
  }

  // if password is correct generate access and refresh token

  const { accessToken, refreshToken } = await generateAccessandRefreshTokens(
    user._id
  );
  // send cookies

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    // to make it only server configureable
    // cuz by default anyone can modify it from frontend
    httpOnly: true,
    secure: true,
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
  //find user

  await User.findByIdAndUpdate(
    // fixed logout logic
    req.user._id, // assumes you added user id in auth middleware
    {
      $set: { refreshToken: null },
    },
    {
      new: true,
    }
  );
  // await User.findByIdAndUpdate(
  //     {
  //         $set:{
  //             refreshToken : undefined
  //         }
  //     },
  //     {
  //         new: true
  //     }
  // )

  const options = {
    // to make it only server configureable
    // cuz by default anyone can modify it from frontend
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new APIError(401, "Unauthorized Request Access");
  }

  try {
    // here refresh token's secret key is accessed
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
      // to make it only server configureable
      // cuz by default anyone can modify it from frontend
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newrefreshToken } =
      await generateAccessandRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { refreshToken: newrefreshToken },
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
  return res
    .status(200)
    .json(
      200,
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
        // can be as fullName only and it will also save it as
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

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  generateAccessandRefreshTokens,
};

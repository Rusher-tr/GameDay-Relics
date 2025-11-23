import { APIError } from "../utils/Apierror.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import Jwt from "jsonwebtoken"
import { User } from "../models/user.models.js"


export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new APIError(401, "Unauthorized Request")
        }
        const decodedToken = Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )
        if (!user) {
            throw new APIError(401, "Invalid Access Token")
        }
        req.user = user;
        next()
    }
    catch (err) {
        throw new APIError(401, err?.message, "Invalid Access----Token")
    }
})

// Optional JWT verification - doesn't throw error if no token, just sets req.user if token is valid
export const optionalVerifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            req.user = null;
            return next()
        }
        const decodedToken = Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )
        if (user) {
            req.user = user;
        } else {
            req.user = null;
        }
        next()
    }
    catch (err) {
        req.user = null;
        next()
    }
})
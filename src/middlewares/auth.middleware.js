import { APIError } from "../utils/Apierror.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import Jwt from "jsonwebtoken"
import { User } from "../models/user.models.js"


export const verifyJWT = asyncHandler(async (req, _, next) => {
    // If access token is not given then if user uses custom header, mainly it comes as Authorization
    // if thats there then replace it with Bearer cuz that or access token's cookie is needed here  
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

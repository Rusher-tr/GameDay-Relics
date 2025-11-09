import { Router } from "express";
import { loginUser, logoutUser, registerUser,refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

// tested SUCCESS
router.route("/register").post(registerUser)

// tested SUCCESS
router.route("/login").post(loginUser)

//________________________secure routes

// tested SUCCESS
router.route("/logout").post(verifyJWT,logoutUser)


// testef Failed REFRESH TOKEN NOT WORKING
router.route("/refresh-token").post(refreshAccessToken)


// tested SUCCESS
router.route("/change-password").post(verifyJWT,changeCurrentPassword)

// DK what its doing BUT TESTED SUCCESS
router.route("/current-user").get(verifyJWT,getCurrentUser)

//tested ------ NOT SURE HOW IT WORKS :p
router.route("/update-account").patch(verifyJWT,updateAccountDetails)


export default router

// export default allows you to give name according to your choice if not then call the method or anything 
// according to the exported file's decleared name 
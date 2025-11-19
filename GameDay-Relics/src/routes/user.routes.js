import { Router } from "express";
import { loginUser, logoutUser, registerUser,refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updatePaymentSettings, getPaymentSettings } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

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

router.route("/current-user").get(verifyJWT, getCurrentUser)

//tested ------ NOT SURE HOW IT WORKS :p
router.route("/update-account").patch(verifyJWT,updateAccountDetails)

// Seller payment settings routes
router.route("/payment-settings").get(verifyJWT, authorizeRoles("seller"), getPaymentSettings)
router.route("/payment-settings").patch(verifyJWT, authorizeRoles("seller"), updatePaymentSettings)


export default router

// export default allows you to give name according to your choice if not then call the method or anything 
// according to the exported file's decleared name 
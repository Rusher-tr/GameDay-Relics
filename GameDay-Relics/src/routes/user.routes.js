import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updatePaymentSettings, getPaymentSettings } from "../controllers/user.controller.js";
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router()

// tested SUCCESS
router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
//________________________secure routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(optionalVerifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/payment-settings").get(verifyJWT, authorizeRoles("seller"), getPaymentSettings)
router.route("/payment-settings").patch(verifyJWT, authorizeRoles("seller"), updatePaymentSettings)


export default router
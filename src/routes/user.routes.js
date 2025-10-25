import { Router } from "express";
import { loginUser, logoutUser, registerUser,refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount: 1,
        },
        {
            name:"coverImage",
            maxCount:1,
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

//________________________secure routes

router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changeCurrentPassword)

router.route("/current-user").get(verifyJWT,getCurrentUser)

//tested ------ NOT SURE HOW IT WORKS :p
router.route("/update-account").patch(verifyJWT,updateAccountDetails)


export default router

// export default allows you to give name according to your choice if not then call the method or anything 
// according to the exported file's decleared name 
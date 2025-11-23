import { Router } from "express";
import {
    getAllProducts,
    searchProducts,
    getSingleProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    verifiyProduct,
} from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

// Public routes - Available to all users
//TESTED SUCCESS
router.route("/").get(getAllProducts);
router.route("/search").get(searchProducts);
router.route("/:id").get(getSingleProduct);
// Seller & Admin only routes
router.route("/create").post(verifyJWT, authorizeRoles("seller", "admin"), upload.array("images", 12), createProduct);
router.route("/update/:id").patch(verifyJWT, authorizeRoles("seller", "admin"), updateProduct);
router.route("/delete/:id").delete(verifyJWT, authorizeRoles("seller", "admin"), deleteProduct);
// Admin only routes
router.route("/verify/:id").post(verifyJWT, authorizeRoles("admin", "seller"), verifiyProduct);

export default router;
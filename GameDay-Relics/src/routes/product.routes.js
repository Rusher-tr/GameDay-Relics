import { Router } from "express";
import { 
    getAllProducts,
    getProductById,
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

//______________
router.route("/search").get(getProductById); // Search by name functionality




// Seller & Admin only routes

router.route("/create").post(
    verifyJWT,
    authorizeRoles("seller", "admin"),
    upload.array("images", 12),
    createProduct
);

// TESTED SUCCESS
router.route("/update/:id").patch(
    verifyJWT,
    authorizeRoles("seller", "admin"),
    updateProduct
);

// TESTED SUCCESS
router.route("/delete/:id").delete(
    verifyJWT,
    authorizeRoles("seller", "admin"),
    deleteProduct
);


// Admin only routes
router.route("/verify/:id").post(
    verifyJWT,
    authorizeRoles("admin"),
    verifiyProduct
);

export default router;
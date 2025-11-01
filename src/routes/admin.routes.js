import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { forceCancelOrder, getAllOrders, getOrderAmountStats, getAllUsers, forcedDeleteUser } from "../controllers/admin.controller.js";

const router = Router();

// TESTED SUCCESS
router.patch("/FCO/:id/cancel",verifyJWT,authorizeRoles("admin"),forceCancelOrder);

// TESTED SUCCESS
router.get("/getorders",verifyJWT,authorizeRoles("admin"),getAllOrders);

// TESTED SUCCESS
router.get("/amount-stats",verifyJWT,authorizeRoles("admin"),getOrderAmountStats);

// TESTED SUCCESS
router.get("/users",verifyJWT,authorizeRoles("admin"),getAllUsers);

// TESTED SUCCESS
router.delete("/users/:id/force-delete",verifyJWT,authorizeRoles("admin"),forcedDeleteUser);

export default router;
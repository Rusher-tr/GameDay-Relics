import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
    forceCancelOrder,
    getAllOrders,
    getOrderAmountStats,
    getAllUsers,
    forcedDeleteUser,
    removeProduct,
    solveDispute,
    getEscrowPayments,
    releaseEscrowPayment,
    getAllDisputes,
    getDisputeDetails,
    processDisputeRefund,
    releaseEscrowForDispute,
    resolveDispute
} from "../controllers/admin.controller.js";

const router = Router();

router.patch("/:id/remove-product",verifyJWT,authorizeRoles("admin"),removeProduct);

router.post("/solve-dispute",verifyJWT,authorizeRoles("admin"),solveDispute)

// TESTED SUCCESS
router.patch("/FCO/:id/cancel", verifyJWT, authorizeRoles("admin"), forceCancelOrder);

// TESTED SUCCESS
router.get("/getorders", verifyJWT, authorizeRoles("admin"), getAllOrders);

// TESTED SUCCESS
router.get("/amount-stats", verifyJWT, authorizeRoles("admin"), getOrderAmountStats);

// TESTED SUCCESS
router.get("/users", verifyJWT, authorizeRoles("admin"), getAllUsers);

// TESTED SUCCESS
router.delete("/users/:id/force-delete", verifyJWT, authorizeRoles("admin"), forcedDeleteUser);

// New admin panel endpoints for frontend
router.get("/escrow-payments", verifyJWT, authorizeRoles("admin"), getEscrowPayments);
router.post("/escrow/:escrowId/release", verifyJWT, authorizeRoles("admin"), releaseEscrowPayment);
router.get("/disputes", verifyJWT, authorizeRoles("admin"), getAllDisputes);
router.get("/disputes/:disputeId", verifyJWT, authorizeRoles("admin"), getDisputeDetails);
router.post("/disputes/:disputeId/resolve", verifyJWT, authorizeRoles("admin"), resolveDispute);
router.post("/disputes/:disputeId/refund", verifyJWT, authorizeRoles("admin"), processDisputeRefund);
router.post("/disputes/:disputeId/release-escrow", verifyJWT, authorizeRoles("admin"), releaseEscrowForDispute);

export default router;
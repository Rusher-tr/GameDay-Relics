import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
  createOrder,
  getOrderById,
  cancelOrder,
  raiseDispute,
  getOrdersByUser,
  getOrdersBySeller,
  markBuyerSatisfaction,
  selectDeliveryGateway,
  confirmShippingProvider,
  confirmDelivery,
  processAutoSatisfaction,
  processExpiredSellerConfirmations,
} from "../controllers/order.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Auto-satisfaction (for cron jobs/internal use) - MUST BE BEFORE /:id ROUTES
router.post("/process-auto-satisfaction", processAutoSatisfaction);
// Auto-cancel orders where seller didn't confirm within 7 days (for cron jobs/internal use)
router.post("/process-expired-confirmations", processExpiredSellerConfirmations);

// TESTED SUCCESS
router.route("/:id/raise-dispute").post(verifyJWT, authorizeRoles("buyer"), upload.array("evidence", 10), raiseDispute)
router.post("/create", verifyJWT, authorizeRoles("buyer"), createOrder);
router.get("/mine", verifyJWT, authorizeRoles("buyer"), getOrdersByUser);
router.get("/seller", verifyJWT, authorizeRoles("seller"), getOrdersBySeller);

router.get("/:id", verifyJWT, getOrderById);
// Cancel (buyer)
// TESTED SUCCESS
router.post("/:id/cancel", verifyJWT, authorizeRoles("buyer"), cancelOrder);
router.post("/:id/satisfaction", verifyJWT, authorizeRoles("buyer"), markBuyerSatisfaction);
router.post("/:id/select-delivery", verifyJWT, authorizeRoles("buyer"), selectDeliveryGateway);
router.post("/:id/confirm-shipping", verifyJWT, authorizeRoles("seller"), confirmShippingProvider);
router.post("/:id/confirm-delivery", verifyJWT, authorizeRoles("seller"), confirmDelivery);

// Disputes
router.post("/:id/dispute", verifyJWT, authorizeRoles("buyer"), raiseDispute);
export default router;

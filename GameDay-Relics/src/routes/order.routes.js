import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
  createOrder,
  getOrderById,
  cancelOrder,
  //updateOrder,
  raiseDispute,
  getOrdersByUser,
  getOrdersBySeller,
  markBuyerSatisfaction,
  selectDeliveryGateway,
  confirmShippingProvider,
  //holdInEscrow,
  releaseEscrow,
  refundOrder,
  //logOrderAction,
} from "../controllers/order.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();


// TESTED SUCCESS
router.route("/:id/raise-dispute").post(verifyJWT,authorizeRoles("buyer"),upload.array("evidence",10),raiseDispute)


// Buyer creates order
// // TESTED PARTIAL SUCCESS
// router.post("/", verifyJWT, authorizeRoles("buyer"), createOrder);


router.post("/create", verifyJWT, authorizeRoles("buyer"), createOrder);


// Buyer view own orders
// TESTED SUCCESS
router.get("/mine", verifyJWT, authorizeRoles("buyer"), getOrdersByUser);


// Seller view orders for their products
// TESTED SUCCESS
router.get("/seller", verifyJWT, authorizeRoles("seller"), getOrdersBySeller);


// Get single order if buyer/seller/admin

router.get("/:id", verifyJWT, getOrderById); // controller checks ownership/role

// Cancel (buyer)

// TESTED SUCCESS
router.post("/:id/cancel", verifyJWT, authorizeRoles("buyer"), cancelOrder);

// Mark buyer satisfaction
router.post("/:id/satisfaction", verifyJWT, authorizeRoles("buyer"), markBuyerSatisfaction);

// Delivery Gateway Selection (buyer during checkout)
router.post("/:id/select-delivery", verifyJWT, authorizeRoles("buyer"), selectDeliveryGateway);

// Shipping Provider Confirmation (seller after payment)
router.post("/:id/confirm-shipping", verifyJWT, authorizeRoles("seller"), confirmShippingProvider);

// Seller actions: hold/release escrow, update shipping

     //router.post("/:id/hold", verifyJWT, authorizeRoles("seller"), holdInEscrow);

router.post("/:id/release", verifyJWT, authorizeRoles("seller", "admin"), releaseEscrow);
router.post("/:id/refund", verifyJWT, authorizeRoles("seller", "admin"), refundOrder);

// Disputes
router.post("/:id/dispute", verifyJWT, authorizeRoles("buyer"), raiseDispute);

export default router;

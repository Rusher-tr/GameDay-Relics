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
  //holdInEscrow,
  releaseEscrow,
  refundOrder,
  //logOrderAction,
} from "../controllers/order.controller.js";

const router = Router();

// Buyer creates order
// TESTED PARTIAL SUCCESS
router.post("/", verifyJWT, authorizeRoles("buyer"), createOrder);


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

// Seller actions: hold/release escrow, update shipping

     //router.post("/:id/hold", verifyJWT, authorizeRoles("seller"), holdInEscrow);

router.post("/:id/release", verifyJWT, authorizeRoles("seller", "admin"), releaseEscrow);
router.post("/:id/refund", verifyJWT, authorizeRoles("seller", "admin"), refundOrder);

// Disputes
router.post("/:id/dispute", verifyJWT, authorizeRoles("buyer"), raiseDispute);

export default router;

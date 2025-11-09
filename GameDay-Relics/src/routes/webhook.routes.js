// routes/webhook.routes.js
import express from "express";
import { stripeWebhook } from "../controllers/webhook.controller.js";

const router = express.Router();
router.post(
  "/stripe",
  express.raw({ type: "application/json" }), // raw body for Stripe signature
  stripeWebhook
);

export default router;

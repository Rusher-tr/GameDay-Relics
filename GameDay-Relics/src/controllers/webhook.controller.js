import { stripe } from "../utils/stripe.js";
import { Order } from "../models/order.models.js";

export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata.orderId;

    await Order.findByIdAndUpdate(orderId, {
      status: "Escrow", 
    });
  }

  res.json({ received: true });
};

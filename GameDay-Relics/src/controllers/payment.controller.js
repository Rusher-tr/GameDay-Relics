// // import { APIError } from '../utils/Apierror.js';
// // import { stripe } from '../utils/stripe.js';
// // import { Order } from '../models/order.models.js';
// // import { User } from '../models/user.models.js';

// // // ─────────────────────────────────────────────
// // // 1️⃣ Internal function — used by TOP service
// // // ─────────────────────────────────────────────

// // export const createCheckoutSession_INTERNAL = async (buyerId, orderId) => {

// //   const buyer = await User.findOne({ buyerId });
// //   if (!buyer) {
// //     throw new APIError(404, 'Buyer not found');
// //   }
// //   const order = await Order.findById(orderId)
// //     .populate('productId')
// //     .populate('postId')
// //     .populate('transactionId');

// //   if (!order) throw new apiError(404, 'Order not found');

// //   let price;
// //   if(order.postId){
// //     const offer = await Offer.findOne({postId: order.postId, status: 'accepted'});
// //     price = offer.amount
// //   }
  
// //   const item = order.productId || order.postId;
// //   if (!item) throw new apiError(400, 'No product or post linked to order');

// //   // Create Stripe Checkout session
// //   const session = await stripe.checkout.sessions.create({
// //     payment_method_types: ['card'],
// //     mode: 'payment',
// //     line_items: [
// //       {
// //         price_data: {
// //           currency: 'pkr',
// //           product_data: {
// //             name: item.title || 'Item',
// //             description: item.description || '',
// //           }, 
// //           unit_amount: Math.round(item.price * 100) || Math.round(price * 100),
// //         },
// //         quantity: order.quantity || 1,
// //       },
// //     ],
// //     metadata: {
// //       orderId: order._id.toString(),
// //       buyerId: buyer._id.toString(),
// //       transactionId: order.transactionId._id.toString(),
// //       type: order.productId ? 'product' : 'post',
// //     },
// //     success_url: `${process.env.LOCAL_URL}/api/v1/item/success?session_id={CHECKOUT_SESSION_ID} `,
// //     cancel_url: `${process.env.LOCAL_URL}/api/v1/item/cancel?session_id={CHECKOUT_SESSION_ID}`,
// //   });

// //   return session;
// // };

// // controllers/payment.controller.js
// import { APIError } from "../utils/Apierror.js";
// import { stripe } from "../utils/stripe.js";
// import { Order } from "../models/order.models.js";
// import { User } from "../models/user.models.js";

// export const createCheckoutSession_INTERNAL = async (buyerId, orderId) => {
//   const buyer = await User.findById(buyerId);
//   if (!buyer) throw new APIError(404, "Buyer not found");

//   const order = await Order.findById(orderId).populate("productId");
//   if (!order) throw new APIError(404, "Order not found");

//   const item = order.productId;
//   if (!item) throw new APIError(400, "No product linked to order");

//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ["card"],
//     mode: "payment",
//     line_items: [
//       {
//         price_data: {
//           currency: "pkr",
//           product_data: {
//             name: item.title || "Item",
//             description: item.description || "",
//           },
//           unit_amount: Math.round(item.price * 100),
//         },
//         quantity: 1,
//       },
//     ],
//     metadata: {
//       orderId: order._id.toString(),
//       buyerId: buyer._id.toString(),
//     },
//     success_url: `${process.env.LOCAL_URL}/api/v1/payment/success?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${process.env.LOCAL_URL}/api/v1/payment/cancel`,
//   });

//   return session;
// };
// controllers/payment.controller.js
import { APIError } from "../utils/Apierror.js";
import { stripe } from "../utils/stripe.js";
import { Order } from "../models/order.models.js";
import { User } from "../models/user.models.js";

export const createCheckoutSession_INTERNAL = async (buyerId, orderId) => {
  const buyer = await User.findById(buyerId);
  if (!buyer) throw new APIError(404, "Buyer not found");

  const order = await Order.findById(orderId).populate("productId");
  if (!order) throw new APIError(404, "Order not found");

  const item = order.productId;
  if (!item) throw new APIError(400, "No product linked to order");

  // ✅ Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "pkr",
          product_data: {
            name: item.title || "Item",
            description: item.description || "",
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      orderId: order._id.toString(),
      buyerId: buyer._id.toString(),
    },
    success_url: `${process.env.LOCAL_URL}/api/v1/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.LOCAL_URL}/api/v1/payment/cancel`,
  });

  // ✅ Save Stripe session ID into Order as transactionId
  order.transactionId = session.id;
  await order.save();

  // Return the session to frontend
  return session;
};

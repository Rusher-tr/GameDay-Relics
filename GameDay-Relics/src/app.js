import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// const app = express();
// app.use(
//   cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true,
//   })
// );

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN.split(",");

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routes/user.routes.js";
import productRouter from "./routes/product.routes.js";
import orderRouter from "./routes/order.routes.js";
import adminRouter from "./routes/admin.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

app.use("/api/v/payment", paymentRoutes);
app.use("/api/v/order", orderRouter);
app.use("/webhook", webhookRoutes);
app.use("/api/v/users", userRouter);
app.use("/api/v/products", productRouter);
app.use("/api/v/orders", orderRouter);
app.use("/api/v/admins", adminRouter);
export { app };


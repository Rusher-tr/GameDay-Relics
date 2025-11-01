import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// urlencoded is used to parse incoming requests with urlencoded payloads
// extended allows to use obj in obj etc and limit is size limit

app.use(express.static("public"));
// to serve static files like images css js or anything and tell it to where to access them from

// to use CRUD of cookies in user browser
app.use(cookieParser());

/// ________________________ ROUTES IMPORT

import userRouter from "./routes/user.routes.js";
import productRouter from "./routes/product.routes.js";
import orderRouter from "./routes/order.routes.js";
import adminRouter from "./routes/admin.routes.js";

/// ROUTES declaration

app.use("/api/v/users", userRouter);
app.use("/api/v/products",productRouter);
app.use("/api/v/orders",orderRouter);
app.use("/api/v/admins",adminRouter);
export { app };

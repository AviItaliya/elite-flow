import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import superadminRoutes from "./routes/superadminRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { stripeWebhookController } from "./controllers/stripeWebhookController.js";
import renewalRoutes from "./routes/renewalRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.post("/api/payments/webhook", express.raw({ type: "application/json" }), stripeWebhookController);

app.use(express.json({limit: "10kb"}));
app.use(express.urlencoded({extended: true, limit: "10kb"}));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "EliteFlow API is running",
  });
});

app.use("/api/superadmin", superadminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/renewals", renewalRoutes);

export default app;
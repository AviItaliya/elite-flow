import { Router } from "express";
import { createCheckoutController } from "../controllers/paymentController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const paymentRoutes = Router();

paymentRoutes.post("/checkout", authenticate, authorize("ADMIN"), createCheckoutController);

export default paymentRoutes;
import { Router } from "express";
import {createSubscriptionController, getCompanySubscriptionController, getSubscriptionHistoryController, changeSubscriptionPlanController, cancelSubscriptionController} from "../controllers/subscriptionController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const subscriptionRoutes = Router();

subscriptionRoutes.post("/", authenticate, authorize("ADMIN"), createSubscriptionController);
subscriptionRoutes.get("/company", authenticate, authorize("ADMIN", "USER"), getCompanySubscriptionController);
subscriptionRoutes.get("/company/history", authenticate, authorize("ADMIN", "USER"), getSubscriptionHistoryController);
subscriptionRoutes.patch("/change-plan", authenticate, authorize("ADMIN"), changeSubscriptionPlanController);
subscriptionRoutes.patch("/cancel", authenticate, authorize("ADMIN"), cancelSubscriptionController);

export default subscriptionRoutes;
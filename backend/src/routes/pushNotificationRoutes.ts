import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { testPushNotificationController } from "../controllers/pushNotificationController.js";

const pushNotificationRoutes = Router();

pushNotificationRoutes.post("/test", authenticate, testPushNotificationController);

export default pushNotificationRoutes;
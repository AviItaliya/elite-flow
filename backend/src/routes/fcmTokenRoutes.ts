import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { registerFcmTokenController, getMyFcmTokensController, deleteMyFcmTokenController } from "../controllers/fcmTokenController.js";

const fcmTokenRoutes = Router();

fcmTokenRoutes.post("/", authenticate, registerFcmTokenController);
fcmTokenRoutes.get("/", authenticate, getMyFcmTokensController);
fcmTokenRoutes.delete("/", authenticate, deleteMyFcmTokenController);

export default fcmTokenRoutes;
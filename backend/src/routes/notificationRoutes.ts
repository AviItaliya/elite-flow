import { Router } from "express";
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } from "../controllers/notificationController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const notificationRoutes = Router();

notificationRoutes.use(authenticate, authorize("ADMIN", "USER", "SUPERADMIN"));

notificationRoutes.get("/unread-count", getUnreadNotificationCount);
notificationRoutes.patch("/read-all", markAllNotificationsRead);
notificationRoutes.get("/", getNotifications);
notificationRoutes.patch("/:id/read", markNotificationRead);

export default notificationRoutes;
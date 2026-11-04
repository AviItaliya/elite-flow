import { Router } from "express";
import { getTasks, getTaskById, createTaskController, updateTaskController, updateTaskStatusController, deleteTaskController, getTaskHistoryController } from "../controllers/taskController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { requireWritableSubscription } from "../middleware/subscriptionAccessMiddleware.js";

const taskRoutes = Router();

taskRoutes.get("/project/:id", authenticate, authorize("ADMIN", "USER"), getTasks);
taskRoutes.get("/:id/history", authenticate, authorize("ADMIN", "USER"), getTaskHistoryController);
taskRoutes.get("/:id", authenticate, authorize("ADMIN", "USER"), getTaskById);
taskRoutes.post("/", authenticate, authorize("ADMIN"), requireWritableSubscription, createTaskController);
taskRoutes.put("/:id", authenticate, authorize("ADMIN"), requireWritableSubscription, updateTaskController);
taskRoutes.patch("/:id/status", authenticate, authorize("ADMIN", "USER"), requireWritableSubscription, updateTaskStatusController);
taskRoutes.delete("/:id", authenticate, authorize("ADMIN"), requireWritableSubscription, deleteTaskController);

export default taskRoutes;

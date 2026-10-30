import { Router } from "express";
import {getTasks, getTaskById, createTaskController, updateTaskController, updateTaskStatusController, deleteTaskController, getTaskHistoryController} from "../controllers/taskController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { requireWritableSubscription } from "../middleware/subscriptionAccessMiddleware.js";

const taskRoutes = Router();

taskRoutes.get("/project/:id", authenticate, authorize("ADMIN", "USER"), getTasks);
taskRoutes.post("/", authenticate, authorize("ADMIN", "USER"), requireWritableSubscription, createTaskController);
taskRoutes.get("/:id/history", authenticate, authorize("ADMIN", "USER"), getTaskHistoryController);
taskRoutes.get("/:id", authenticate, authorize("ADMIN", "USER"), getTaskById);
taskRoutes.put("/:id", authenticate, authorize("ADMIN", "USER"), requireWritableSubscription, updateTaskController);
taskRoutes.delete("/:id", authenticate, authorize("ADMIN"), requireWritableSubscription, deleteTaskController);
taskRoutes.patch("/:id/status", authenticate, authorize("ADMIN", "USER"), requireWritableSubscription, updateTaskStatusController);

export default taskRoutes;
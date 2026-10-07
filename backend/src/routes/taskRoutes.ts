import { Router } from "express";
import {getTasks, getTaskById, createTaskController, updateTaskController, updateTaskStatusController, deleteTaskController, getTaskHistoryController} from "../controllers/taskController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const taskRoutes = Router();

taskRoutes.get("/project/:id", authenticate, authorize("ADMIN", "USER", "SUPERADMIN"), getTasks);
taskRoutes.post("/", authenticate, authorize("ADMIN", "USER", "SUPERADMIN"), createTaskController);
taskRoutes.get("/:id/history", authenticate, authorize("ADMIN", "USER", "SUPERADMIN"), getTaskHistoryController);
taskRoutes.get("/:id", authenticate, authorize("ADMIN", "USER", "SUPERADMIN"), getTaskById);
taskRoutes.put("/:id", authenticate, authorize("ADMIN", "USER", "SUPERADMIN"), updateTaskController);
taskRoutes.patch("/:id/status", authenticate, authorize("ADMIN", "USER", "SUPERADMIN"), updateTaskStatusController);
taskRoutes.delete("/:id", authenticate, authorize("ADMIN", "SUPERADMIN"), deleteTaskController);

export default taskRoutes;
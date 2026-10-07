import { Router } from "express";
import {getAdminDashboardController} from "../controllers/dashboardController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const dashboardRoutes = Router();

dashboardRoutes.get("/admin", authenticate, authorize("ADMIN", "SUPERADMIN"), getAdminDashboardController);

export default dashboardRoutes;
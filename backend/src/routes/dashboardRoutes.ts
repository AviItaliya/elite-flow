import { Router } from "express";

import {getAdminDashboardController, getUserDashboardController, getSuperadminDashboardController} from "../controllers/dashboardController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const dashboardRoutes = Router();

dashboardRoutes.get("/superadmin", authenticate, authorize("SUPERADMIN"), getSuperadminDashboardController);
dashboardRoutes.get("/admin", authenticate, authorize("ADMIN"), getAdminDashboardController);
dashboardRoutes.get("/user", authenticate, authorize("USER"), getUserDashboardController);

export default dashboardRoutes;
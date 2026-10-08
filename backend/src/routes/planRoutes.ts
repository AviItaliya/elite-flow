import { Router } from "express";
import {createPlanController, getPlansController, getPlanController, updatePlanController, updatePlanStatusController} from "../controllers/planController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const planRoutes = Router();

planRoutes.post("/", authenticate, authorize("SUPERADMIN"), createPlanController);
planRoutes.get("/", getPlansController);
planRoutes.get("/:id", getPlanController);
planRoutes.patch("/:id", authenticate, authorize("SUPERADMIN"), updatePlanController);
planRoutes.patch("/:id/status", authenticate, authorize("SUPERADMIN"), updatePlanStatusController);

export default planRoutes;
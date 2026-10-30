import { Router } from "express";
import {getProjects, getProjectById, createProjectController, updateProjectController, updateProjectStatusController, deleteProjectController, getProjectMembersController, addProjectMemberController, removeProjectMemberController} from "../controllers/projectController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { requireWritableSubscription } from "../middleware/subscriptionAccessMiddleware.js";

const projectRoutes = Router();

projectRoutes.get("/", authenticate, authorize("ADMIN", "USER"), getProjects);
projectRoutes.get("/:id", authenticate, authorize("ADMIN", "USER"), getProjectById);
projectRoutes.post("/", authenticate, authorize("ADMIN"), requireWritableSubscription, createProjectController);
projectRoutes.put("/:id", authenticate, authorize("ADMIN"), requireWritableSubscription, updateProjectController);
projectRoutes.patch("/:id/status", authenticate, authorize("ADMIN"), requireWritableSubscription, updateProjectStatusController);
projectRoutes.delete("/:id", authenticate, authorize("ADMIN"), requireWritableSubscription, deleteProjectController);

projectRoutes.get("/:id/members", authenticate, authorize("ADMIN", "USER"), getProjectMembersController);
projectRoutes.post("/:id/members", authenticate, authorize("ADMIN"), requireWritableSubscription, addProjectMemberController);
projectRoutes.delete("/:id/members/:userId", authenticate, authorize("ADMIN"), requireWritableSubscription, removeProjectMemberController);

export default projectRoutes;
import { Router } from "express";
import {getProjects, getProjectById, createProjectController, updateProjectController, updateProjectStatusController, deleteProjectController, getProjectMembersController, addProjectMemberController, removeProjectMemberController} from "../controllers/projectController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const projectRoutes = Router();

projectRoutes.get("/", authenticate, authorize("ADMIN", "USER", "SUPERADMIN"), getProjects);
projectRoutes.get("/:id", authenticate, authorize("ADMIN", "USER", "SUPERADMIN"), getProjectById);
projectRoutes.post("/", authenticate, authorize("ADMIN", "SUPERADMIN"), createProjectController);
projectRoutes.put("/:id", authenticate, authorize("ADMIN", "SUPERADMIN"), updateProjectController);
projectRoutes.patch("/:id/status", authenticate, authorize("ADMIN", "SUPERADMIN"), updateProjectStatusController);
projectRoutes.delete("/:id", authenticate, authorize("ADMIN", "SUPERADMIN"), deleteProjectController);

projectRoutes.get("/:id/members", authenticate, authorize("ADMIN", "USER", "SUPERADMIN"), getProjectMembersController);
projectRoutes.post("/:id/members", authenticate, authorize("ADMIN", "SUPERADMIN"), addProjectMemberController);
projectRoutes.delete("/:id/members/:userId", authenticate, authorize("ADMIN", "SUPERADMIN"), removeProjectMemberController);

export default projectRoutes;
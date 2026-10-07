import { Router } from "express";
import {getComments, createCommentController, updateCommentController, deleteCommentController} from "../controllers/commentController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const commentRoutes = Router();

commentRoutes.get("/task/:id", authenticate, authorize("ADMIN", "USER", "SUPERADMIN"), getComments);
commentRoutes.post("/task/:id", authenticate, authorize("ADMIN", "USER", "SUPERADMIN"), createCommentController);
commentRoutes.put("/:id", authenticate, authorize("ADMIN", "USER", "SUPERADMIN"), updateCommentController);
commentRoutes.delete("/:id", authenticate, authorize("ADMIN", "USER", "SUPERADMIN"), deleteCommentController);

export default commentRoutes;
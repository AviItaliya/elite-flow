import { Router } from "express";
import {getComments, createCommentController, updateCommentController, deleteCommentController} from "../controllers/commentController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { requireWritableSubscription } from "../middleware/subscriptionAccessMiddleware.js";

const commentRoutes = Router();

commentRoutes.get("/task/:id", authenticate, authorize("ADMIN", "USER"), getComments);
commentRoutes.post("/task/:id", authenticate, authorize("ADMIN", "USER"), requireWritableSubscription, createCommentController);
commentRoutes.put("/:id", authenticate, authorize("ADMIN", "USER"), requireWritableSubscription, updateCommentController);
commentRoutes.delete("/:id", authenticate, authorize("ADMIN", "USER"), requireWritableSubscription, deleteCommentController);

export default commentRoutes;
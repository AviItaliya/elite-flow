import { Router } from "express";
import { createUser, deleteUser, getMe, getUSerById, getUsers, updateUser, updateUserStatus } from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const userRoutes = Router();
userRoutes.get("/me", authenticate, getMe);
userRoutes.get("/", authenticate, authorize("ADMIN", "SUPERADMIN"), getUsers);
userRoutes.post("/", authenticate, authorize("ADMIN", "SUPERADMIN"), createUser);
userRoutes.get("/:id", authenticate, authorize("ADMIN", "SUPERADMIN"), getUSerById);
userRoutes.put("/:id", authenticate, authorize("ADMIN", "SUPERADMIN"), updateUser);
userRoutes.patch("/:id/status", authenticate, authorize("ADMIN", "SUPERADMIN"), updateUserStatus);
userRoutes.delete("/:id", authenticate, authorize("ADMIN", "SUPERADMIN"), deleteUser);

export default userRoutes;
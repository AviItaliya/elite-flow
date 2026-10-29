import { Router } from "express";
import { createUser, deleteMyProfileImage, deleteUser, getMe, getUSerById, getUsers, updateUser, updateUserStatus, uploadMyProfileImage } from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const userRoutes = Router();
userRoutes.get("/me", authenticate, getMe);
userRoutes.patch("/me/profile-image", authenticate, upload.single("image"), uploadMyProfileImage);
userRoutes.delete("/me/profile-image", authenticate, deleteMyProfileImage);
userRoutes.get("/", authenticate, authorize("ADMIN", "SUPERADMIN"), getUsers);
userRoutes.post("/", authenticate, authorize("ADMIN", "SUPERADMIN"), createUser);
userRoutes.get("/:id", authenticate, authorize("ADMIN", "SUPERADMIN"), getUSerById);
userRoutes.put("/:id", authenticate, authorize("ADMIN", "SUPERADMIN"), updateUser);
userRoutes.patch("/:id/status", authenticate, authorize("ADMIN", "SUPERADMIN"), updateUserStatus);
userRoutes.delete("/:id", authenticate, authorize("ADMIN", "SUPERADMIN"), deleteUser);

export default userRoutes;
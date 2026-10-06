import { Router } from "express";

import {
  authenticate,
  type AuthenticatedRequest,
} from "../middleware/authMiddleware.js";

import { authorize } from "../middleware/roleMiddleware.js";

const router = Router();

router.get(
  "/protected",
  authenticate,
  (req: AuthenticatedRequest, res) => {
    return res.status(200).json({
      success: true,
      message: "You can access this protected route",
      user: req.user,
    });
  }
);

router.get(
  "/admin",
  authenticate,
  authorize("ADMIN", "SUPERADMIN"),
  (req: AuthenticatedRequest, res) => {
    return res.status(200).json({
      success: true,
      message: "Admin route accessed successfully",
      user: req.user,
    });
  }
);

export default router;
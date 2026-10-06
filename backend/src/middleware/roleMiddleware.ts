import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./authMiddleware.js";

type UserRole = | "SUPERADMIN" | "ADMIN" | "USER";

export const authorize = (
  ...allowedRoles: UserRole[]
) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};
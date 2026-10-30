import type { NextFunction, Response } from "express";
import { prisma } from "../config/database.js";
import type { AuthenticatedRequest } from "./authMiddleware.js";

export const requireWritableSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }
  if (req.user.role === "SUPERADMIN") {
    return next();
  }
  const companyId = req.user.companyId;
  if (!companyId) {
    return res.status(403).json({
      success: false,
      message: "Company access is required",
    });
  }
  try {
    const now = new Date();
    const subscription = await prisma.subscription.findFirst({
      where: {
        companyId,
        status: {
          in: ["ACTIVE", "TRIAL"],
        },
        startDate: {
          lte: now,
        },
        OR: [
          { endDate: null },
          { endDate: { gt: now } },
        ],
      },
      select: {
        id: true,
      },
    });
    if (!subscription) {
      return res.status(403).json({
        success: false,
        code: "SUBSCRIPTION_READ_ONLY",
        message: "Your subscription has expired or is inactive. " +
          "You can view existing data, but you must renew " +
          "your subscription to make changes.",
      });
    }
    return next();
  } catch (error) {
    console.error("Subscription access verification failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to verify subscription access",
    });
  }
};
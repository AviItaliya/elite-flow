import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";

interface AccessTokenPayload {
  userId: string;
  role: string;
  companyId: string | null;
}

const accessSecret = process.env.JWT_ACCESS_SECRET;

if (!accessSecret) {
  throw new Error("JWT_ACCESS_SECRET is not defined");
}

export interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Invalid authorization format",
    });
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token is required",
    });
  }

  let decoded: AccessTokenPayload;

  try {
    const verified = jwt.verify(token, accessSecret);

    if (
      typeof verified === "string" ||
      typeof verified.userId !== "string" ||
      typeof verified.role !== "string" ||
      !(
        typeof verified.companyId === "string" ||
        verified.companyId === null
      )
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token payload",
      });
    }

    decoded = {
      userId: verified.userId,
      role: verified.role,
      companyId: verified.companyId,
    };
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      select: {
        id: true,
        role: true,
        companyId: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt || user.status !== "ACTIVE") {
      return res.status(401).json({
        success: false,
        message: "Your account is inactive or unavailable",
      });
    }

    // Reject tokens issued before a role or company-membership change.
    if (
      decoded.role !== user.role ||
      decoded.companyId !== user.companyId
    ) {
      return res.status(401).json({
        success: false,
        message: "Your session is no longer valid. Please log in again.",
      });
    }

    // Attach current database values rather than trusting stale token data.
    req.user = {
      userId: user.id,
      role: user.role,
      companyId: user.companyId,
    };

    return next();
  } catch (error) {
    console.error("Authentication database check failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to authenticate your request",
    });
  }
};
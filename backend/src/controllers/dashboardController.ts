import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getAdminDashboard } from "../services/dashboardService.js";

export const getAdminDashboardController = async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    if (!authenticatedReq.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    if (!authenticatedReq.user.companyId) {
      return res.status(400).json({
        success: false,
        message: "User is not associated with a company",
      });
    }
    const dashboard = await getAdminDashboard(authenticatedReq.user.companyId);
    return res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to get dashboard",
    });
  }
};
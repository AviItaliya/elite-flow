import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

import {
  getAdminDashboard,
  getUserDashboard,
  getSuperadminDashboard,
} from "../services/dashboardService.js";

// export const getAdminDashboardController = async (
//   req: AuthenticatedRequest,
//   res: Response,
// ) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "Authentication required",
//       });
//     }

//     if (!req.user.companyId) {
//       return res.status(400).json({
//         success: false,
//         message: "User is not associated with a company",
//       });
//     }

//     const dashboard = await getAdminDashboard(
//       req.user.companyId,
//       req.user.userId,
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Admin dashboard fetched successfully",
//       data: dashboard,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message:
//         error instanceof Error
//           ? error.message
//           : "Failed to get admin dashboard",
//     });
//   }
// };

export const getSuperadminDashboardController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const dashboard = await getSuperadminDashboard();

    return res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to get superadmin dashboard",
    });
  }
};

export const getAdminDashboardController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!req.user.companyId) {
      return res.status(400).json({
        success: false,
        message: "Company is required",
      });
    }

    const dashboard = await getAdminDashboard(
      req.user.companyId
    );

    return res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to get admin dashboard",
    });
  }
};

export const getUserDashboardController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!req.user.companyId) {
      return res.status(400).json({
        success: false,
        message: "Company is required",
      });
    }

    const dashboard = await getUserDashboard(
      req.user.userId,
      req.user.companyId
    );

    return res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to get user dashboard",
    });
  }
};
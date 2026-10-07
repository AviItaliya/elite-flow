import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

import { getCurrentCompany, updateCurrentCompany } from "../services/companyService.js";
import { updateCompanySchema } from "../validators/companyValidator.js";

export const getMyCompany = async (
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
        message: "User is not associated with a company",
      });
    }

    const company = await getCurrentCompany(req.user.companyId);

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to get company",
    });
  }
};

export const updateMyCompany = async (
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
        message: "User is not associated with a company",
      });
    }

    const result = updateCompanySchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const company = await updateCurrentCompany(
      req.user.companyId,
      result.data
    );

    return res.status(200).json({
      success: true,
      message: "Company updated successfully",
      data: company,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update company",
    });
  }
};


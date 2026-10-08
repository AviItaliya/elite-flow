import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {createCompanySubscription, getCompanySubscription, getCompanySubscriptionHistory, changeCompanyPlan, cancelCompanySubscription} from "../services/subscriptionService.js";
import {createSubscriptionSchema, changeSubscriptionPlanSchema} from "../validators/subscriptionValidator.js";

export const createSubscriptionController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(403).json({
        success: false,
        message: "Company is required",
      });
    }
    const result = createSubscriptionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }
    const subscription = await createCompanySubscription(companyId, result.data.planId);
    return res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: subscription,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create subscription",
    });
  }
};

export const getCompanySubscriptionController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(403).json({
        success: false,
        message: "Company is required",
      });
    }
    const subscription = await getCompanySubscription(companyId);
    return res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Subscription not found",
    });
  }
};

export const getSubscriptionHistoryController = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(403).json({
          success: false,
          message: "Company is required",
        });
      }
      const subscriptions = await getCompanySubscriptionHistory(companyId);
      return res.status(200).json({
        success: true,
        data: subscriptions,
      });
    } catch {
      return res.status(500).json({
        success: false,
        message: "Failed to get subscription history",
      });
    }
  };

export const changeSubscriptionPlanController = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(403).json({
          success: false,
          message: "Company is required",
        });
      }
      const result = changeSubscriptionPlanSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        });
      }
      const subscription = await changeCompanyPlan(companyId, result.data.planId);
      return res.status(200).json({
        success: true,
        message: "Subscription plan changed successfully",
        data: subscription,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to change subscription plan",
      });
    }
  };

export const cancelSubscriptionController = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(403).json({
          success: false,
          message: "Company is required",
        });
      }
      const subscription = await cancelCompanySubscription(companyId);
      return res.status(200).json({
        success: true,
        message: "Subscription cancelled successfully",
        data: subscription,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to cancel subscription",
      });
    }
  };
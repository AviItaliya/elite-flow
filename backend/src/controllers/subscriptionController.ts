import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {getCompanySubscription, getCompanySubscriptionHistory, cancelCompanySubscription, createCompanySubscription} from "../services/subscriptionService.js";
import {createSubscriptionSchema, changeSubscriptionPlanSchema} from "../validators/subscriptionValidator.js";
import { createCheckoutSession, createPlanChangeCheckoutSession } from "../services/paymentService.js";
import { findActivePlanById } from "../repositories/planRepository.js";

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
    const plan = await findActivePlanById(result.data.planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found or inactive",
      });
    }

    // FREE PLAN: Activate immediately without Stripe.
    if (Number(plan.price) === 0) {
      const subscription = await createCompanySubscription(
        companyId,
        plan.id
      );
      return res.status(201).json({
        success: true,
        message: "Free subscription activated successfully",
        data: {
          type: "FREE",
          subscription,
        },
      });
    }

    // PAID PLAN: Create Stripe Checkout session.
    const checkout = await createCheckoutSession(companyId, plan.id);
    return res.status(201).json({
      success: true,
      message: "Stripe Checkout session created successfully",
      data: {
        type: "PAID",
        ...checkout,
      },
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
  const result = changeSubscriptionPlanSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid subscription plan data",
      errors: result.error.flatten(),
    });
  }
  const companyId = req.user?.companyId;
  if (!companyId) {
    return res.status(401).json({
      success: false,
      message: "Company context is required",
    });
  }
  try {
    const checkout = await createPlanChangeCheckoutSession(companyId, result.data.planId);
    return res.status(201).json({
      success: true,
      message: "Plan-change checkout created successfully",
      data: {
        type: "PLAN_CHANGE",
        paymentId: checkout.paymentId,
        sessionId: checkout.sessionId,
        checkoutUrl: checkout.checkoutUrl,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create plan-change checkout",
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
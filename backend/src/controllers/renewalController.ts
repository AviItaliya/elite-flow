
import type { Response } from "express";
import { getSubscriptionRenewalEligibility } from "../services/subscriptionService.js";
import { createRenewalCheckoutSession } from "../services/paymentService.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export const checkRenewalEligibility = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const companyId = req.user?.companyId;
    const subscriptionId = req.params.subscriptionId;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        message: "Company access is required",
      });
    }

    if (typeof subscriptionId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid subscription ID is required",
      });
    }

    const result = await getSubscriptionRenewalEligibility(
      companyId,
      subscriptionId
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to check renewal eligibility";

    return res.status(400).json({
      success: false,
      message,
    });
  }
};

export const createRenewalCheckout = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const companyId = req.user?.companyId;
    const subscriptionId = req.params.subscriptionId;
    const { planId } = req.body as { planId?: string };

    if (!companyId) {
      return res.status(403).json({
        success: false,
        message: "Company access is required",
      });
    }

    if (
      typeof subscriptionId !== "string" ||
      typeof planId !== "string" ||
      !planId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid subscription ID and plan ID are required",
      });
    }

    const result = await createRenewalCheckoutSession(
      companyId,
      subscriptionId,
      planId
    );

    return res.status(201).json({
      success: true,
      message: "Renewal Checkout session created",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create renewal Checkout session";

    return res.status(400).json({
      success: false,
      message,
    });
  }
};
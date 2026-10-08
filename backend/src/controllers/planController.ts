import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {createNewPlan, getAllPlans, getPlan, editPlan, changePlanStatus} from "../services/planService.js";
import {createPlanSchema, updatePlanSchema, updatePlanStatusSchema} from "../validators/planValidator.js";

export const createPlanController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = createPlanSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }
    const plan = await createNewPlan(result.data);
    return res.status(201).json({
      success: true,
      message: "Plan created successfully",
      data: plan,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create plan",
    });
  }
};

export const getPlansController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const plans = await getAllPlans();
    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get plans",
    });
  }
};

export const getPlanController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const plan = await getPlan(String(req.params.id));
    return res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Plan not found",
    });
  }
};

export const updatePlanController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = updatePlanSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }
    const plan = await editPlan(String(req.params.id), result.data);
    return res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      data: plan,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update plan",
    });
  }
};

export const updatePlanStatusController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = updatePlanStatusSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }
    const plan = await changePlanStatus(String(req.params.id), result.data.isActive);
    return res.status(200).json({
      success: true,
      message: "Plan status updated successfully",
      data: plan,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update plan status",
    });
  }
};
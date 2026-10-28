import type { Response, NextFunction } from "express";
import { createCheckoutSession } from "../services/paymentService.js";
import { createCheckoutSchema } from "../validators/paymentValidator.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export const createCheckoutController = async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validation = createCheckoutSchema.safeDecode(req.body);
    if(!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: validation.error.flatten()
      });
      return;
    }
    if(!req.user?.companyId) {
      res.status(403).json({
        success: false,
        message: "A company account is required"
      });
      return;
    }
    const result = await createCheckoutSession(req.user.companyId, validation.data.planId);
    res.status(201).json({
      success: true,
      message: "Checkout session created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
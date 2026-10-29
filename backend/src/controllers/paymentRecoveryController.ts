import type { Request, Response } from "express";
import { recoverReviewRequiredPayment } from "../services/paymentRecoveryService.js";

export const recoverPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const paymentId = req.params.paymentId;
    if (!paymentId || Array.isArray(paymentId)) {
      res.status(400).json({
        success: false,
        message: "A valid payment ID is required",
      });
      return;
    }
    const result = await recoverReviewRequiredPayment(paymentId);
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        paymentId: result.paymentId,
        subscriptionId: result.subscriptionId,
      },
    });
  } catch (error) {
    console.error("Payment recovery failed:", error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Payment recovery failed",
    });
  }
};
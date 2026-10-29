import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { sendPushNotification } from "../services/pushNotificationService.js";

export const testPushNotificationController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { title, body } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof body !== "string" ||
      !body.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and body are required",
      });
    }

    const result = await sendPushNotification({
      userId,
      title: title.trim(),
      body: body.trim(),
      data: {
        type: "TEST_NOTIFICATION",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Push notification request processed",
      data: result,
    });
  } catch (error) {
    console.error("Push notification test failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process push notification request",
    });
  }
};

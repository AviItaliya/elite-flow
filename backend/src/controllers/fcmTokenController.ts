import type { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getUserFcmTokens, registerUserFcmToken, removeUserFcmToken } from "../services/fcmTokenService.js";

export const registerFcmTokenController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if(!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }
        const {token} = req.body;
        if(typeof token !== "string" || !token.trim()) {
            return res.status(400).json({
                success: false,
                message: "A valid FCM token is required"
            });
        }
        await registerUserFcmToken(userId, token.trim());
        return res.status(200).json({
            success: true,
            message: "FCM token registered successfully"
        });
    } catch (error) {
        console.error("FCM token registration failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to register FCM token",
        });
    }
};

export const getMyFcmTokensController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if(!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }
        const tokens = await getUserFcmTokens(userId);
        return res.status(200).json({
            success: true,
            data: {tokens},
        });
    } catch (error) {
        console.error("Fetching FCM tokens failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch FCM tokens"
        });
    }
};

export const deleteMyFcmTokenController = async (req:AuthenticatedRequest, res:Response) => {
    try {
        const userId = req.user?.userId;
        if(!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const {token} = req.body;
        if(typeof token !== "string" || !token.trim()) {
            return res.status(400).json({
                success: false,
                message: "A valid FCM token is required"
            });
        }
        await removeUserFcmToken(userId, token.trim());
        return res.status(200).json({
            success: true,
            message: "FCM token removed successfully"
        });
    } catch (error) {
        console.error("FCM token deletion failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to remove FCM token",
        });
    }
};

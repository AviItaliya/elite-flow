import { firebaseMessaging } from "../config/firebase.js";
import { prisma } from "../config/database.js";
import { deleteFcmToken } from "../repositories/fcmTokenRepository.js";

interface PushNotificationInput {
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>;
}

export const sendPushNotification = async ({
    userId, title, body, data = {},
}: PushNotificationInput) => {
    const registeredTokens = await prisma.fcmToken.findMany({
        where: {userId},
        select: {token: true}
    });
    if(registeredTokens.length === 0) {
        return {
            success: true,
            sent: 0,
            failed: 0,
            message: "No registered devices found for this user"
        };
    }
    let sent = 0;
    let failed = 0;
    for(const {token} of registeredTokens) {
        try {
            await firebaseMessaging.send({
                token,
                notification: {
                    title, 
                    body
                }, 
                data,
            });
            sent++;
        } catch (error) {
            failed++;
            const errorCode = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : undefined;
            console.error("FCM notification failed:", {
              code: errorCode,
              message:
                error instanceof Error
                  ? error.message
                  : String(error),
            });
            if(errorCode === "messaging/registration-token-not-registered" ||
                errorCode === "messaging/invalid-registration-token"
            ) {
                await deleteFcmToken(userId, token);
            }
        }
    }
    return {
        success: failed === 0,
        sent,
        failed,
    };
};
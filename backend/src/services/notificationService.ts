import { NotificationType } from "../generated/prisma/client.js";
import { prisma } from "../config/database.js";
import { getIO } from "../config/socket.js";

interface CreateNotificationInput {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
}

export const createNotification = async (input: CreateNotificationInput) => {
    const notification = await prisma.notification.create({
        data: {
            userId: input.userId,
            type: input.type,
            title: input.title,
            message: input.message,
            link: input.link,
        },
    });
    try {
        getIO().to(`user:${input.userId}`).emit("notification", notification);
    } catch (error) {
        console.error("Failed to emit real-time notification:", error);
    }
    return notification;
};

export const getUserNotifications = async (userId: string, page = 1, limit = 20) => {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where: {userId},
            orderBy: {createdAt: "desc"},
            skip: (safePage - 1) * safeLimit,
            take: safeLimit,
        }),
        prisma.notification.count({
            where: {userId},
        }),
        prisma.notification.count({
            where: {userId, readAt: null},
        }),
    ]);

    return {
        notifications,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil(total / safeLimit),
        },
        unreadCount,
    };
};

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
    const result = await prisma.notification.updateMany({
        where: {
            id: notificationId,
            userId,
            readAt: null,
        },
        data: {
            readAt: new Date(),
        },
    });
    return {updated: result.count > 0};
};

export const markAllNotificationAsRead = async (userId: string) => {
    const result = await prisma.notification.updateMany({
        where: {userId, readAt: null},
        data: {readAt: new Date()},
    });
    return {updatedCount: result.count};
};
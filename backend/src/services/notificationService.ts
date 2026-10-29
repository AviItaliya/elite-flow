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

export type NotificationSortOrder = "asc" | "desc";
export type NotificationReadFilter = "all" | "read" | "unread";

export interface NotificationListFilters {
  page: number;
  limit: number;
  readStatus: NotificationReadFilter;
  sortOrder: NotificationSortOrder;
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

export const getUserNotifications = async (userId: string, filters: NotificationListFilters) => {
  const where = {
    userId,
    ...(filters.readStatus === "read"
      ? { readAt: { not: null } }
      : filters.readStatus === "unread"
        ? { readAt: null }
        : {}),
  };
  const skip = (filters.page - 1) * filters.limit;
  const [notifications, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: [
        { createdAt: filters.sortOrder },
        { id: "asc" },
      ],
      skip,
      take: filters.limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    }),
  ]);
  return {
    notifications,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
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
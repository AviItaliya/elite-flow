import type { Response } from "express";
import { prisma } from "../config/database.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getUserNotifications, markAllNotificationAsRead, markNotificationAsRead, NotificationListFilters, NotificationReadFilter, NotificationSortOrder } from "../services/notificationService.js";

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const pageValue = req.query.page ?? "1";
    const limitValue = req.query.limit ?? "20";
    if (typeof pageValue !== "string" || !/^[1-9]\d*$/.test(pageValue)) {
      return res.status(400).json({
        success: false,
        message: "page must be a positive integer",
      });
    }
    if (typeof limitValue !== "string" || !/^[1-9]\d*$/.test(limitValue)) {
      return res.status(400).json({
        success: false,
        message: "limit must be a positive integer",
      });
    }
    const page = Number(pageValue);
    const limit = Number(limitValue);
    if (!Number.isSafeInteger(page)) {
      return res.status(400).json({
        success: false,
        message: "page is too large",
      });
    }
    if (!Number.isSafeInteger(limit) || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "limit must be between 1 and 100",
      });
    }
    const readStatusValue = req.query.readStatus ?? "all";
    if (typeof readStatusValue !== "string" || !["all", "read", "unread"].includes(readStatusValue)) {
      return res.status(400).json({
        success: false,
        message: "readStatus must be all, read, or unread",
      });
    }
    const sortOrderValue = req.query.sortOrder ?? "desc";
    if (typeof sortOrderValue !== "string" || !["asc", "desc"].includes(sortOrderValue)) {
      return res.status(400).json({
        success: false,
        message: "sortOrder must be asc or desc",
      });
    }
    const filters: NotificationListFilters = {
      page,
      limit,
      readStatus: readStatusValue as NotificationReadFilter,
      sortOrder: sortOrderValue as NotificationSortOrder,
    };
    const data = await getUserNotifications(req.user.userId, filters);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Failed to get notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get notifications",
    });
  }
};

export const getUnreadNotificationCount = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if(!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const unreadCount = await prisma.notification.count({
            where: {
                userId: req.user.userId,
                readAt: null,
            },
        });
        return res.status(200).json({
            success: true,
            data: {unreadCount}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to get unread notification count"
        });
    }
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if(!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }
        const notificationId = req.params.id;
        if(typeof notificationId !== "string" || !notificationId.trim()) {
            return res.status(400).json({
                success: false,
                message: "Valid notification ID is required",
            });
        }
        const result = await markNotificationAsRead(req.user.userId, notificationId);
        if(!result.updated) {
            const notification = await prisma.notification.findFirst({
                where: {
                    id: notificationId,
                    userId: req.user.userId,
                },
                select: {id: true}
            });
            if(!notification) {
                return res.status(404).json({
                    success: false,
                    message: "Notification not found",
                });
            }
        }
        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Faield to mark notification as read",
        });
    }
};

export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if(!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication Required"
            });
        }
        const result = await markAllNotificationAsRead(req.user.userId);
        return res.status(200).json({
            success: true,
            message: "All notification marked as read",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to mark notifications as read",
        });
    }
};
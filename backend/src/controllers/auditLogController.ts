import type { Request, Response, NextFunction } from "express";
import { getCompanyAuditLogs } from "../services/auditLogService.js";
import AppError from "../utils/AppError.js";
import { AuditLogFilters, AuditLogSortBy, AuditLogSortOrder } from "../repositories/auditLogRepository.js";

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authenticatedRequest = req as Request & {
      user?: { companyId?: string | null };
    };
    const companyId = authenticatedRequest.user?.companyId;
    if (!companyId) {
      throw new AppError("Company ID is required", 400);
    }
    const pageValue = req.query.page ?? "1";
    const limitValue = req.query.limit ?? "20";
    if (typeof pageValue !== "string" || !/^[1-9]\d*$/.test(pageValue)) {
      throw new AppError("page must be a positive integer", 400);
    }
    if (typeof limitValue !== "string" || !/^[1-9]\d*$/.test(limitValue)) {
      throw new AppError("limit must be a positive integer", 400);
    }
    const page = Number(pageValue);
    const limit = Number(limitValue);
    if (!Number.isSafeInteger(page)) {
      throw new AppError("page is too large", 400);
    }
    if (!Number.isSafeInteger(limit) || limit > 100) {
      throw new AppError("limit must be between 1 and 100", 400);
    }
    let search: string | undefined;
    if (req.query.search !== undefined) {
      if (typeof req.query.search !== "string") {
        throw new AppError("search must be a string", 400);
      }
      search = req.query.search.trim();
      if (search.length > 200) {
        throw new AppError("search cannot exceed 200 characters", 400);
      }
      if (!search) {
        search = undefined;
      }
    }
    const actionValue = req.query.action;
    const entityValue = req.query.entity;
    if (actionValue !== undefined && (typeof actionValue !== "string" || !actionValue.trim() || actionValue.length > 100)) {
      throw new AppError("Invalid action filter", 400);
    }
    if (entityValue !== undefined && (typeof entityValue !== "string" || !entityValue.trim() || entityValue.length > 100)) {
      throw new AppError("Invalid entity filter", 400);
    }
    const sortByValue = req.query.sortBy ?? "createdAt";
    const sortOrderValue = req.query.sortOrder ?? "desc";
    if (typeof sortByValue !== "string" || !["createdAt", "action"].includes(sortByValue)) {
      throw new AppError("sortBy must be createdAt or action", 400);
    }
    if (typeof sortOrderValue !== "string" || !["asc", "desc"].includes(sortOrderValue)) {
      throw new AppError("sortOrder must be asc or desc", 400);
    }
    const filters: AuditLogFilters = {
      page,
      limit,
      search,
      action: typeof actionValue === "string" ? actionValue.trim() : undefined,
      entity: typeof entityValue === "string" ? entityValue.trim() : undefined,
      sortBy: sortByValue as AuditLogSortBy,
      sortOrder: sortOrderValue as AuditLogSortOrder,
    };
    const result = await getCompanyAuditLogs(companyId, filters);
    return res.status(200).json({
      success: true,
      message: "Audit logs retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
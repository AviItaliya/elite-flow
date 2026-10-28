import type { Request, Response, NextFunction } from "express";
import { getCompanyAuditLogs } from "../services/auditLogService.js";
import AppError from "../utils/AppError.js";

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authenticatedRequest = req as Request & {user?: {companyId?: string | null}};
        const companyId = authenticatedRequest.user?.companyId;
        if(!companyId) {
            throw new AppError("Company ID is required", 400);
        }
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 20);
        if(!Number.isInteger(page) || page < 1 || limit > 100) {
            throw new AppError("Invalid pagination parameters", 400);
        }
        const result = await getCompanyAuditLogs(companyId, page, limit);
        res.status(200).json({
            success: true,
            message: "Audit logs retrived successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};
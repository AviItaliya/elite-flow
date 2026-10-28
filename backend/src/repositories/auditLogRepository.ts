import { prisma } from "../config/database.js";

interface CreateAuditLogInput {
    actorId?: string | null;
    companyId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    details?: object | null;
    ipAddress?: string | null;
    userAgent?: string | null;
}

export const createAuditLog = async (input: CreateAuditLogInput) => {
    return prisma.auditLog.create({
        data: {
            actorId: input.actorId ?? null,
            companyId: input.companyId ?? null,
            action: input.action,
            entity: input.entity,
            entityId: input.entityId ?? null,
            details: input.details ?? undefined,
            ipAddress: input.ipAddress ?? null,
            userAgent: input.userAgent ?? null
        },        
    });
};

export const findAuditLogsByCompany = async (companyId: string, page = 1, limit = 20) => {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where: {companyId},
            orderBy: {createdAt: "desc"},
            skip: (safePage - 1) * safeLimit,
            take: safeLimit
        }),
        prisma.auditLog.count({
            where: {companyId},
        }),
    ]);
    return {
        logs,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil(total / safeLimit)
        },
    };
};
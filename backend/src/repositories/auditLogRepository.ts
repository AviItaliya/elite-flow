import { prisma } from "../config/database.js";

export type AuditLogSortBy = "createdAt" | "action";
export type AuditLogSortOrder = "asc" | "desc";

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

export interface AuditLogFilters {
  page: number;
  limit: number;
  search?: string;
  action?: string;
  entity?: string;
  sortBy: AuditLogSortBy;
  sortOrder: AuditLogSortOrder;
}

export const findAuditLogsByCompany = async (companyId: string, filters: AuditLogFilters) => {
  const where = {
    companyId,
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.entity ? { entity: filters.entity } : {}),
    ...(filters.search
      ? {
          OR: [
            {
              action: {
                contains: filters.search,
                mode: "insensitive" as const,
              },
            },
            {
              entity: {
                contains: filters.search,
                mode: "insensitive" as const,
              },
            },
            {
              entityId: {
                contains: filters.search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };
  const skip = (filters.page - 1) * filters.limit;
  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: [
        { [filters.sortBy]: filters.sortOrder },
        { id: "asc" },
      ],
      skip,
      take: filters.limit,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return {
    logs,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
};
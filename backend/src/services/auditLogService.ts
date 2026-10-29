import { AuditLogFilters, createAuditLog, findAuditLogsByCompany } from "../repositories/auditLogRepository.js";

interface CreateAuditLogInput {
    actorId?: string | null;
    companyId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    details: object | null;
    ipAddress?: string | null;
    userAgent?: string | null;
}

export const logAuditEvent = async (input: CreateAuditLogInput) => {
    return createAuditLog(input);
};

export const getCompanyAuditLogs = async (companyId: string, filters: AuditLogFilters) => {
  return findAuditLogsByCompany(companyId, filters);
};
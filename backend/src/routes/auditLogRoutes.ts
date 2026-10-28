import { Router } from "express";
import { getAuditLogs } from "../controllers/auditLogController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const auditLogRoutes = Router();

auditLogRoutes.get("/", authenticate, getAuditLogs);

export default auditLogRoutes;
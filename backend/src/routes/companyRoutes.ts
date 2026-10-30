import { Router } from "express";
import { getMyCompany, updateMyCompany } from "../controllers/companyController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { requireWritableSubscription } from "../middleware/subscriptionAccessMiddleware.js";

const companyRoutes = Router();

companyRoutes.get("/me", authenticate, authorize("ADMIN", "SUPERADMIN"), getMyCompany);
companyRoutes.put("/me", authenticate, authorize("ADMIN"), requireWritableSubscription, updateMyCompany);

export default companyRoutes;
import { Router } from "express";
import { getMyCompany, updateMyCompany } from "../controllers/companyController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const companyRoutes = Router();

companyRoutes.get("/me", authenticate, authorize("ADMIN", "SUPERADMIN"), getMyCompany);
companyRoutes.put("/me", authenticate, authorize("ADMIN"), updateMyCompany);

export default companyRoutes;
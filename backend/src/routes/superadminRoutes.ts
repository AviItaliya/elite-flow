import { Router } from "express";
import { setupSuperadmin } from "../controllers/superadminController.js";
import { recoverPayment } from "../controllers/paymentRecoveryController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const superadminRoutes = Router();

// Existing setup route — preserved.
superadminRoutes.post("/setup", setupSuperadmin);

// Recover a payment that requires review.
// Only authenticated SUPERADMIN users can access this endpoint.
superadminRoutes.post("/payments/:paymentId/recover", authenticate, authorize("SUPERADMIN"), recoverPayment);

export default superadminRoutes;
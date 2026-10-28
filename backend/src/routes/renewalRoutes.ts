import { Router } from "express";
import {checkRenewalEligibility, createRenewalCheckout} from "../controllers/renewalController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const renewalRoutes = Router();

renewalRoutes.get("/:subscriptionId/eligibility", authenticate, checkRenewalEligibility);
renewalRoutes.post("/:subscriptionId/checkout", authenticate, createRenewalCheckout);

export default renewalRoutes;
import { Router } from "express";
import {setupSuperadmin} from "../controllers/superadminController.js";

const superadminRoutes = Router();

superadminRoutes.post("/setup", setupSuperadmin);

export default superadminRoutes;
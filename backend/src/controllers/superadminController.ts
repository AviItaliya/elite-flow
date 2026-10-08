import type { Request, Response } from "express";
import { createSuperadmin } from "../services/superadminService.js";
import {createSuperadminSchema} from "../validators/superadminValidator.js";

export const setupSuperadmin = async (req: Request, res: Response) => {
  try {
    const setupSecret = process.env.SUPERADMIN_SETUP_SECRET;
    if (!setupSecret) {
      return res.status(500).json({
        success: false,
        message: "Superadmin setup is not configured",
      });
    }

    const providedSecret = req.headers["x-superadmin-setup-secret"];
    if (typeof providedSecret !== "string" || providedSecret !== setupSecret) {
      return res.status(403).json({
        success: false,
        message: "Invalid superadmin setup secret",
      });
    }
    const data = createSuperadminSchema.parse(req.body);
    const user = await createSuperadmin(data);
    return res.status(201).json({
      success: true,
      message: "Superadmin created successfully",
      data: user,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
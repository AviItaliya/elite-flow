import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import AppError from "../utils/AppError.js";
import multer from "multer";

const errorMiddleware: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        success: false,
        message: "File size cannot exceed 5 MB.",
      });
      return;
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      res.status(400).json({
        success: false,
        message: "Only one file can be uploaded at a time.",
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: "Invalid file upload.",
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  if (error instanceof Error && error.message === "Not allowed by CORS") {
    res.status(403).json({
      success: false,
      message: "Origin is not allowed",
    });
    return;
  }

  if (error instanceof Error) {
    const databaseError = error as Error & {
      code?: string;
    };

    if (databaseError.name === "PrismaClientKnownRequestError") {
      switch (databaseError.code) {
        case "P2002":
          res.status(409).json({
            success: false,
            message: "A record with this value already exists",
          });
          return;

        case "P2025":
          res.status(404).json({
            success: false,
            message: "Requested record was not found",
          });
          return;

        default:
          console.error("Database operation failed:", {
            code: databaseError.code,
          });

          res.status(500).json({
            success: false,
            message: "Database operation failed",
          });
          return;
      }
    }
  }
  console.error("Unhandled application error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export default errorMiddleware;
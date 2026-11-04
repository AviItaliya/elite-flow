import { Response } from "express";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { createCommentSchema, updateCommentSchema } from "../validators/commentValidator.js";
import { createTaskComment, deleteTaskComment, getTaskComments, updateTaskComment } from "../services/commentService.js";
import { getRequiredCompanyId } from "../utils/company.js";
import { getParamId } from "../utils/request.js";
import type { CommentListFilters, CommentSortOrder } from "../repositories/commentRepository.js";

const sendCommentError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues,
    });
  }
  if (error instanceof Error) {
    const message = error.message;
    if (message === "Task not found" || message === "Comment not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }
    if (message.includes("permission") || message.includes("access") || message.includes("only edit your own comments") ||
      message.includes("only delete your own comments") || message.includes("inactive")) {
      return res.status(403).json({
        success: false,
        message,
      });
    }
    if (message === "Comment cannot be empty") {
      return res.status(400).json({
        success: false,
        message,
      });
    }
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({
    success: false,
    message: fallbackMessage,
  });
};

export const getComments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const companyId = getRequiredCompanyId(req);
    const taskId = getParamId(req);
    const pageValue = req.query.page ?? "1";
    const limitValue = req.query.limit ?? "10";
    const page = Number(pageValue);
    const limit = Number(limitValue);
    if (typeof pageValue !== "string" || !Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        success: false,
        message: "page must be a positive integer",
      });
    }
    if (typeof limitValue !== "string" || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "limit must be an integer between 1 and 100",
      });
    }
    let search: string | undefined;
    if (req.query.search !== undefined) {
      if (typeof req.query.search !== "string") {
        return res.status(400).json({
          success: false,
          message: "search must be a string",
        });
      }
      search = req.query.search.trim();
      if (search.length > 200) {
        return res.status(400).json({
          success: false,
          message: "search cannot exceed 200 characters",
        });
      }
      if (!search) {
        search = undefined;
      }
    }
    const sortOrderValue = req.query.sortOrder ?? "asc";
    if (typeof sortOrderValue !== "string" || !["asc", "desc"].includes(sortOrderValue)) {
      return res.status(400).json({
        success: false,
        message: "sortOrder must be asc or desc",
      });
    }
    const filters: CommentListFilters = {
      page,
      limit,
      search,
      sortOrder: sortOrderValue as CommentSortOrder,
    };
    const result = await getTaskComments(taskId, companyId, req.user.userId, filters);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return sendCommentError(
      res,
      error,
      "Failed to get comments",
    );
  }
};

export const createCommentController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const companyId = getRequiredCompanyId(req);
    const taskId = getParamId(req);
    const data = createCommentSchema.parse(req.body);
    const comment = await createTaskComment(taskId, req.user.userId, companyId, data.content);
    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: {
        comment,
      },
    });
  } catch (error) {
    return sendCommentError(
      res,
      error,
      "Failed to create comment",
    );
  }
};

export const updateCommentController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const companyId = getRequiredCompanyId(req);
    const commentId = getParamId(req);
    const data = updateCommentSchema.parse(req.body);
    const comment = await updateTaskComment(commentId, req.user.userId, companyId, data.content);
    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: {
        comment,
      },
    });
  } catch (error) {
    return sendCommentError(
      res,
      error,
      "Failed to update comment",
    );
  }
};

export const deleteCommentController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const companyId = getRequiredCompanyId(req);
    const commentId = getParamId(req);
    await deleteTaskComment(commentId, req.user.userId, companyId);
    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return sendCommentError(
      res,
      error,
      "Failed to delete comment",
    );
  }
};
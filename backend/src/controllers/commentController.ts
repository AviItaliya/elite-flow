import { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {createCommentSchema, updateCommentSchema} from "../validators/commentValidator.js";
import {createTaskComment, deleteTaskComment, getTaskComments, updateTaskComment} from "../services/commentService.js";
import { getRequiredCompanyId } from "../utils/company.js";
import { getParamId } from "../utils/request.js";

export const getComments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getRequiredCompanyId(req);
    const taskId = getParamId(req);
    const comments = await getTaskComments(taskId, companyId);
    return res.status(200).json({
      success: true,
      data: {
        comments,
      },
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to get comments",
    });
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
    const comment = await createTaskComment(
      taskId,
      req.user.userId,
      companyId,
      data.content
    );
    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: {
        comment,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create comment",
    });
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
    const comment = await updateTaskComment(
      commentId,
      req.user.userId,
      companyId,
      data.content
    );
    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: {
        comment,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update comment",
    });
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
    await deleteTaskComment(
      commentId,
      req.user.userId,
      companyId
    );
    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete comment",
    });
  }
};
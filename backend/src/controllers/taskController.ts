import { Response } from "express";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {createTaskSchema, updateTaskSchema, updateTaskStatusSchema} from "../validators/taskValidator.js";
import {createProjectTask, deleteCompanyTask, getCompanyTaskById, getProjectTasks, updateCompanyTask, changeTaskStatus, getCompanyTaskHistory,
  TaskServiceError} from "../services/taskService.js";
import { getRequiredCompanyId } from "../utils/company.js";
import { getParamId } from "../utils/request.js";
import type { TaskListFilters } from "../repositories/taskRepository.js";

const sendControllerError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues,
    });
  }
  if (error instanceof TaskServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({
    success: false,
    message: fallbackMessage,
  });
};

export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const companyId = getRequiredCompanyId(req);
    const projectId = getParamId(req);
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive, and limit must be between 1 and 100",
      });
    }
    const allowedStatuses = ["TODO", "IN_PROGRESS", "DONE", "TESTING", "QA_VERIFIED", "RE_OPEN", "DEPLOYMENT"] as const;
    const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
    const allowedSortFields = ["createdAt", "updatedAt", "title", "dueDate"] as const;
    const statusValue = req.query.status;
    const priorityValue = req.query.priority;
    const sortByValue = req.query.sortBy ?? "createdAt";
    const sortOrderValue = req.query.sortOrder ?? "desc";
    const searchValue = req.query.search;

    if (
      statusValue !== undefined &&
      (typeof statusValue !== "string" ||
        !allowedStatuses.includes(
          statusValue as (typeof allowedStatuses)[number],
        ))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status",
      });
    }

    if (
      priorityValue !== undefined &&
      (typeof priorityValue !== "string" ||
        !allowedPriorities.includes(
          priorityValue as (typeof allowedPriorities)[number],
        ))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid task priority",
      });
    }

    if (
      typeof sortByValue !== "string" ||
      !allowedSortFields.includes(
        sortByValue as (typeof allowedSortFields)[number],
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort field",
      });
    }

    if (
      typeof sortOrderValue !== "string" ||
      !["asc", "desc"].includes(sortOrderValue)
    ) {
      return res.status(400).json({
        success: false,
        message: "Sort order must be asc or desc",
      });
    }

    if (
      searchValue !== undefined &&
      (typeof searchValue !== "string" || searchValue.length > 200)
    ) {
      return res.status(400).json({
        success: false,
        message: "Search must be a string of at most 200 characters",
      });
    }

    const filters: TaskListFilters = {
      page,
      limit,
      search:
        typeof searchValue === "string"
          ? searchValue.trim()
          : undefined,
      status: statusValue as TaskListFilters["status"],
      priority: priorityValue as TaskListFilters["priority"],
      sortBy: sortByValue as TaskListFilters["sortBy"],
      sortOrder: sortOrderValue as TaskListFilters["sortOrder"],
    };

    const result = await getProjectTasks(
      projectId,
      companyId,
      req.user.userId,
      filters,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return sendControllerError(res, error, "Failed to get tasks");
  }
};

export const getTaskById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const companyId = getRequiredCompanyId(req);
    const taskId = getParamId(req);
    const task = await getCompanyTaskById(taskId, companyId, req.user.userId);
    return res.status(200).json({
      success: true,
      data: {
        task,
      },
    });
  } catch (error) {
    return sendControllerError(res, error, "Failed to get task");
  }
};

export const createTaskController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const companyId = getRequiredCompanyId(req);
    const data = createTaskSchema.parse(req.body);
    const task = await createProjectTask(companyId, req.user.userId, data);
    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: {
        task,
      },
    });
  } catch (error) {
    return sendControllerError(res, error, "Failed to create task");
  }
};

export const updateTaskController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const companyId = getRequiredCompanyId(req);
    const taskId = getParamId(req);
    const data = updateTaskSchema.parse(req.body);
    const task = await updateCompanyTask(taskId, companyId, req.user.userId, data);
    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: {
        task,
      },
    });
  } catch (error) {
    return sendControllerError(res, error, "Failed to update task");
  }
};

export const updateTaskStatusController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const companyId = getRequiredCompanyId(req);
    const taskId = getParamId(req);
    const data = updateTaskStatusSchema.parse(req.body);
    const task = await changeTaskStatus(taskId, companyId, req.user.userId, data);
    return res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      data: {
        task,
      },
    });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Failed to update task status",
    );
  }
};

export const deleteTaskController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const companyId = getRequiredCompanyId(req);
    const taskId = getParamId(req);
    await deleteCompanyTask(req.user.userId, taskId, companyId);
    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    return sendControllerError(res, error, "Failed to delete task");
  }
};

export const getTaskHistoryController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const companyId = getRequiredCompanyId(req);
    const taskId = getParamId(req);
    const history = await getCompanyTaskHistory(taskId, companyId, req.user.userId);
    return res.status(200).json({
      success: true,
      data: {
        history,
      },
    });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Failed to get task history",
    );
  }
};
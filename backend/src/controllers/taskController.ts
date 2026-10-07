import { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {  createTaskSchema, updateTaskSchema, updateTaskStatusSchema } from "../validators/taskValidator.js";
import {createProjectTask, deleteCompanyTask, getCompanyTaskById, getProjectTasks, updateCompanyTask, changeTaskStatus, getCompanyTaskHistory} from "../services/taskService.js";
import { getRequiredCompanyId } from "../utils/company.js";
import { getParamId } from "../utils/request.js";

export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getRequiredCompanyId(req);
    const projectId = getParamId(req);
    const tasks = await getProjectTasks(projectId, companyId);
    return res.status(200).json({
      success: true,
      data: {
        tasks,
      },
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to get tasks",
    });
  }
};

export const getTaskById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getRequiredCompanyId(req);
    const taskId = getParamId(req);
    const task = await getCompanyTaskById(taskId, companyId);
    return res.status(200).json({
      success: true,
      data: {
        task,
      },
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Task not found",
    });
  }
};

export const createTaskController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getRequiredCompanyId(req);
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const data = createTaskSchema.parse(req.body);
    const task = await createProjectTask(companyId, user.userId, data);
    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: {
        task,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create task",
    });
  }
};

export const updateTaskController = async (req: AuthenticatedRequest, res: Response ) => {
  try {
    const companyId = getRequiredCompanyId(req);
    const taskId = getParamId(req);
    const user = req.user;
    if (!user) {
       return res.status(401).json({
         success: false,
         message: "Authentication required",
       });
    }
    const data = updateTaskSchema.parse(req.body);
    const task = await updateCompanyTask(taskId, companyId, user.userId, data);
    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: {
        task,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update task",
    });
  }
};

export const updateTaskStatusController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getRequiredCompanyId(req);
    const taskId = getParamId(req);
    const data = updateTaskStatusSchema.parse(req.body);
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const task = await changeTaskStatus(taskId, companyId, user.userId, data);
    return res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      data: {
        task,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update task status",
    });
  }
};

export const deleteTaskController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getRequiredCompanyId(req);
    const taskId = getParamId(req);
    await deleteCompanyTask(taskId, companyId);
    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete task",
    });
  }
};

export const getTaskHistoryController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getRequiredCompanyId(req);
    const taskId = getParamId(req);
    const history = await getCompanyTaskHistory(taskId, companyId);
    return res.status(200).json({
      success: true,
      data: {
        history,
      },
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to get task history",
    });
  }
};
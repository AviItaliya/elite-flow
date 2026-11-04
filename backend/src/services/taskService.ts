import {createTask, deleteTask, findTaskById, findTasksByProject, updateTask, updateTaskStatus} from "../repositories/taskRepository.js";
import type { TaskListFilters } from "../repositories/taskRepository.js";
import {findProjectByIdAndCompany, findProjectMember} from "../repositories/projectRepository.js";
import {findUserByIdAndCompany, findUsersByCompany} from "../repositories/userRepository.js";
import type {CreateTaskInput, UpdateTaskInput, UpdateTaskStatusInput} from "../validators/taskValidator.js";
import {createTaskHistory, findTaskHistory} from "../repositories/taskHistoryRepository.js";
import { requireActiveSubscription } from "./subscriptionService.js";
import { NotificationType } from "../generated/prisma/client.js";
import { createNotification } from "./notificationService.js";
import { logAuditEvent } from "./auditLogService.js";
import { sendPushNotification } from "./pushNotificationService.js";

export class TaskServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "TaskServiceError";
  }
}

const getActiveCompanyUser = async (userId: string, companyId: string) => {
  const user = await findUserByIdAndCompany(userId, companyId);

  if (!user || user.status !== "ACTIVE") {
    throw new TaskServiceError("User not found or inactive", 403);
  }

  return user;
};

const requireCompanyAdmin = async (userId: string, companyId: string) => {
  const user = await getActiveCompanyUser(userId, companyId);

  if (user.role !== "ADMIN") {
    throw new TaskServiceError(
      "Only administrators can perform this action",
      403,
    );
  }

  return user;
};

const ensureProjectAccess = async (projectId: string, userId: string, companyId: string) => {
  const user = await getActiveCompanyUser(userId, companyId);
  if (user.role === "ADMIN") {
    return user;
  }
  if (user.role !== "USER") {
    throw new TaskServiceError("You do not have permission to access this project", 403);
  }
  const membership = await findProjectMember(projectId, userId);
  if (!membership) {
    throw new TaskServiceError("You do not have access to this project", 403);
  }
  return user;
};

const getAccessibleTask = async (taskId: string, companyId: string, userId: string) => {
  const task = await findTaskById(taskId);
  if (!task || task.project.companyId !== companyId) {
    throw new TaskServiceError("Task not found", 404);
  }
  await ensureProjectAccess(task.projectId, userId, companyId);
  return task;
};

const recordTaskAudit = async (actorId: string, companyId: string, action: string, taskId: string, details?: Record<string, unknown>) => {
  try {
    await logAuditEvent({
      actorId,
      companyId,
      action,
      entity: "TASK",
      entityId: taskId,
      details: details ?? null,
    });
  } catch (error) {
    console.error(`Failed to record ${action} audit log:`, error);
  }
};

const notifyTaskAssignee = async (userId: string, title: string, message: string, taskId: string) => {
  try {
    await createNotification({
      userId,
      type: NotificationType.TASK_ASSIGNED,
      title,
      message,
      link: `/tasks/${taskId}`,
    });
  } catch (error) {
    console.error("Failed to create task assignment notification:", error);
  }

  try {
    await sendPushNotification({
      userId,
      title,
      body: message,
      data: {
        type: "TASK_ASSIGNED",
        taskId,
        link: `/tasks/${taskId}`,
      },
    });
  } catch (error) {
    console.error("Failed to send task assignment push notification:", error);
  }
};

export const getProjectTasks = async (projectId: string, companyId: string, userId: string, filters: TaskListFilters) => {
  const project = await findProjectByIdAndCompany(projectId, companyId);
  if (!project) {
    throw new TaskServiceError("Project not found", 404);
  }
  await ensureProjectAccess(projectId, userId, companyId);
  return findTasksByProject(projectId, filters);
};

export const getCompanyTaskById = async (taskId: string, companyId: string, userId: string) => {
  return getAccessibleTask(taskId, companyId, userId);
};

export const createProjectTask = async (companyId: string, createdBy: string, data: CreateTaskInput) => {
  await requireCompanyAdmin(createdBy, companyId);
  const project = await findProjectByIdAndCompany(data.projectId, companyId);
  if (!project) {
    throw new TaskServiceError("Project not found", 404);
  }
  try {
  await requireActiveSubscription(companyId);
  } catch (error) {
    throw new TaskServiceError(error instanceof Error ? error.message : "Subscription verification failed", 403);
  }
  if (project.status === "CANCELLED") {
    throw new TaskServiceError("Cannot create a task in a cancelled project", 400);
  }
  if (data.dueDate && data.dueDate < new Date()) {
    throw new TaskServiceError("Due date cannot be in the past", 400);
  }
  if (data.assignedTo) {
    const assignee = await findUserByIdAndCompany(data.assignedTo, companyId);
    if (!assignee) {
      throw new TaskServiceError("Assignee not found in your company", 400);
    }
    if (assignee.status !== "ACTIVE") {
      throw new TaskServiceError("Inactive users cannot be assigned tasks", 400);
    }
    const membership = await findProjectMember(data.projectId, data.assignedTo);
    if (!membership) {
      throw new TaskServiceError("Assignee must be a member of the project", 400);
    }
  }
  if (data.reportedTo) {
    const reporter = await findUserByIdAndCompany(data.reportedTo, companyId);
    if (!reporter || reporter.role !== "ADMIN") {
      throw new TaskServiceError("Report To must be an administrator from your company", 400);
    }
    if (reporter.status !== "ACTIVE") {
      throw new TaskServiceError("Inactive administrators cannot be selected as Report To", 400);
    }
  }

  const task = await createTask({
    projectId: data.projectId,
    createdBy,
    assignedTo: data.assignedTo,
    reportedTo: data.reportedTo,
    title: data.title,
    description: data.description,
    priority: data.priority,
    dueDate: data.dueDate,
  });

  await createTaskHistory({
    taskId: task.id,
    userId: createdBy,
    action: "TASK_CREATED",
  });

  await recordTaskAudit(
    createdBy,
    companyId,
    "TASK_CREATED",
    task.id,
    {
      projectId: task.projectId,
      title: task.title,
      assignedTo: task.assignedTo,
    },
  );

  if (task.assignedTo && task.assignedTo !== createdBy) {
    await notifyTaskAssignee(
      task.assignedTo,
      "New Task Assigned",
      `You have been assigned a new task: ${task.title}`,
      task.id,
    );
  }
  return task;
};

export const updateCompanyTask = async (taskId: string, companyId: string, userId: string, data: UpdateTaskInput) => {
  await requireCompanyAdmin(userId, companyId);
  const task = await findTaskById(taskId);
  if (!task || task.project.companyId !== companyId) {
    throw new TaskServiceError("Task not found", 404);
  }
  if (data.dueDate && data.dueDate < new Date()) {
    throw new TaskServiceError("Due date cannot be in the past", 400);
  }
  if (data.assignedTo) {
    const assignee = await findUserByIdAndCompany(data.assignedTo, companyId);
    if (!assignee) {
      throw new TaskServiceError("Assignee not found in your company", 400);
    }
    if (assignee.status !== "ACTIVE") {
      throw new TaskServiceError("Inactive users cannot be assigned tasks", 400);
    }
    const membership = await findProjectMember(task.projectId, data.assignedTo);
    if (!membership) {
      throw new TaskServiceError("Assignee must be a member of the project", 400);
    }
  }
  if (data.reportedTo) {
    const reporter = await findUserByIdAndCompany(data.reportedTo, companyId);
    if (!reporter || reporter.role !== "ADMIN") {
      throw new TaskServiceError("Report To must be an administrator from your company", 400);
    }
    if (reporter.status !== "ACTIVE") {
      throw new TaskServiceError("Inactive administrators cannot be selected as Report To", 400);
    }
  }
  const updatedTask = await updateTask(taskId, data);
  await recordTaskAudit(
    userId,
    companyId,
    "TASK_UPDATED",
    taskId,
    {
      changedFields: Object.keys(data),
    },
  );

  if (data.priority !== undefined && data.priority !== task.priority) {
    await createTaskHistory({
      taskId,
      userId,
      action: "PRIORITY_CHANGED",
      oldValue: task.priority,
      newValue: data.priority,
    });
  }

  if (data.assignedTo !== undefined && data.assignedTo !== task.assignedTo) {
    await createTaskHistory({
      taskId,
      userId,
      action: "ASSIGNEE_CHANGED",
      oldValue: task.assignedTo ?? "UNASSIGNED",
      newValue: data.assignedTo ?? "UNASSIGNED",
    });

    await recordTaskAudit(
      userId,
      companyId,
      "TASK_ASSIGNED",
      taskId,
      {
        previousAssignee: task.assignedTo,
        newAssignee: data.assignedTo,
      },
    );

    if (data.assignedTo && data.assignedTo !== userId) {
      await notifyTaskAssignee(
        data.assignedTo,
        "Task Assigned to You",
        `You have been assigned the task: ${updatedTask.title}`,
        updatedTask.id,
      );
    }
  }

  if (data.reportedTo !== undefined && data.reportedTo !== task.reportedTo) {
    await createTaskHistory({
      taskId,
      userId,
      action: "REPORTED_TO_CHANGED",
      oldValue: task.reportedTo ?? "UNASSIGNED",
      newValue: data.reportedTo ?? "UNASSIGNED",
    });
  }

  if (data.title !== undefined && data.title !== task.title) {
    await createTaskHistory({
      taskId,
      userId,
      action: "TITLE_CHANGED",
      oldValue: task.title,
      newValue: data.title,
    });
  }

  return updatedTask;
};

export const changeTaskStatus = async (taskId: string, companyId: string, userId: string, data: UpdateTaskStatusInput) => {
  const task = await getAccessibleTask(taskId, companyId, userId);
  if (task.status === data.status) {
    throw new TaskServiceError(`Task is already ${data.status}`, 400);
  }
  const updatedTask = await updateTaskStatus(taskId, data.status);
  await createTaskHistory({
    taskId,
    userId,
    action: "STATUS_CHANGED",
    oldValue: task.status,
    newValue: updatedTask.status,
  });

  await recordTaskAudit(
    userId,
    companyId,
    "TASK_STATUS_CHANGED",
    taskId,
    {
      previousStatus: task.status,
      newStatus: updatedTask.status,
    },
  );

  try {
    const updatedBy = await findUserByIdAndCompany(userId, companyId);

    const { users: companyUsers } = await findUsersByCompany(companyId, {
      page: 1,
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    const admins = companyUsers.filter(
      (user) =>
        user.role === "ADMIN" &&
        user.status === "ACTIVE" &&
        user.id !== userId,
    );

    for (const admin of admins) {
      try {
        await createNotification({
          userId: admin.id,
          type: NotificationType.TASK_STATUS_CHANGED,
          title: "Task status updated",
          message: `${
            updatedBy?.name ?? "A user"
          } updated the status of task "${updatedTask.title}" from ${
            task.status
          } to ${updatedTask.status}.`,
          link: `/tasks/${updatedTask.id}`,
        });
      } catch (error) {
        console.error(`Failed to notify administrator ${admin.id} about task status change:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to process task status change notifications:", error);
  }
  return updatedTask;
};

export const deleteCompanyTask = async (userId: string, taskId: string, companyId: string) => {
  await requireCompanyAdmin(userId, companyId);
  const task = await findTaskById(taskId);
  if (!task || task.project.companyId !== companyId) {
    throw new TaskServiceError("Task not found", 404);
  }
  const deletedTask = await deleteTask(taskId);
  await recordTaskAudit(
    userId,
    companyId,
    "TASK_DELETED",
    taskId,
    {
      title: task.title,
      projectId: task.projectId,
    },
  );
  return deletedTask;
};

export const getCompanyTaskHistory = async (taskId: string, companyId: string, userId: string) => {
  await getAccessibleTask(taskId, companyId, userId);
  return findTaskHistory(taskId);
};
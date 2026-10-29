import {createTask, deleteTask, findTaskById, findTasksByProject, TaskListFilters, updateTask, updateTaskStatus} from "../repositories/taskRepository.js";
import {findProjectByIdAndCompany, findProjectMember} from "../repositories/projectRepository.js";
import {findUserByIdAndCompany, findUsersByCompany} from "../repositories/userRepository.js";
import type {CreateTaskInput, UpdateTaskInput, UpdateTaskStatusInput} from "../validators/taskValidator.js";
import {createTaskHistory, findTaskHistory} from "../repositories/taskHistoryRepository.js";
import { requireActiveSubscription } from "./subscriptionService.js";
import { NotificationType } from "../generated/prisma/client.js";
import { createNotification } from "./notificationService.js";
import { logAuditEvent } from "./auditLogService.js";
import { sendPushNotification } from "./pushNotificationService.js";

// Record task audit events without interrupting the main task operation.
const recordTaskAudit = async (
  actorId: string,
  companyId: string,
  action: string,
  taskId: string,
  details?: Record<string, unknown>,
) => {
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

// Create an in-app notification and attempt an FCM push independently.
const notifyTaskAssignee = async (
  userId: string,
  title: string,
  message: string,
  taskId: string,
) => {
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

// Get all tasks belonging to a project.
export const getProjectTasks = async (projectId: string, companyId: string, filters: TaskListFilters) => {
  const project = await findProjectByIdAndCompany(projectId, companyId);
  if (!project) {
    throw new Error("Project not found");
  }
  return findTasksByProject(projectId, filters);
};

// Get a single task belonging to the authenticated user's company.
export const getCompanyTaskById = async (taskId: string, companyId: string) => {
  const task = await findTaskById(taskId);
  if (!task || task.project.companyId !== companyId) {
    throw new Error("Task not found");
  }
  return task;
};

// Create a task and notify its assignee when applicable.
export const createProjectTask = async (companyId: string, createdBy: string, data: CreateTaskInput) => {
  // Validate the project.
  const project = await findProjectByIdAndCompany(data.projectId, companyId);
  if (!project) {
    throw new Error("Project not found");
  }
  await requireActiveSubscription(companyId);
  if (project.status === "CANCELLED") {
    throw new Error("Cannot create a task in a cancelled project");
  }
  if (data.dueDate && data.dueDate < new Date()) {
    throw new Error("Due date cannot be in the past");
  }

  // Validate the assignee.
  if (data.assignedTo) {
    const user = await findUserByIdAndCompany(data.assignedTo, companyId);
    if (!user) {
      throw new Error("Assignee not found in your company");
    }
    if (user.status !== "ACTIVE") {
      throw new Error("Inactive users cannot be assigned tasks");
    }
    const member = await findProjectMember(data.projectId, data.assignedTo);
    if (!member) {
      throw new Error("Assignee must be a member of the project");
    }
  }

  // Create the task.
  const task = await createTask({
    projectId: data.projectId,
    createdBy,
    assignedTo: data.assignedTo,
    title: data.title,
    description: data.description,
    priority: data.priority,
    dueDate: data.dueDate,
  });

  // Record task history.
  await createTaskHistory({
    taskId: task.id,
    userId: createdBy,
    action: "TASK_CREATED",
  });

  // Record the audit event.
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

  // Notify the assignee, except when the creator assigned the task to themselves.
  if (task.assignedTo && task.assignedTo !== createdBy) {
    await notifyTaskAssignee(task.assignedTo, "New Task Assigned", `You have been assigned a new task: ${task.title}`, task.id);
  }
  return task;
};

// Update a task and track changes to its assignee, priority, and title.
export const updateCompanyTask = async (
  taskId: string,
  companyId: string,
  userId: string,
  data: UpdateTaskInput,
) => {
  const task = await findTaskById(taskId);
  if (!task || task.project.companyId !== companyId) {
    throw new Error("Task not found");
  }

  // Validate the due date.
  if (data.dueDate && data.dueDate < new Date()) {
    throw new Error("Due date cannot be in the past");
  }

  // Validate the new assignee.
  if (data.assignedTo) {
    const user = await findUserByIdAndCompany(data.assignedTo, companyId);
    if (!user) {
      throw new Error("Assignee not found in your company");
    }
    if (user.status !== "ACTIVE") {
      throw new Error("Inactive users cannot be assigned tasks");
    }

    const member = await findProjectMember(task.projectId, data.assignedTo);
    if (!member) {
      throw new Error("Assignee must be a member of the project");
    }
  }

  // Update the task.
  const updatedTask = await updateTask(taskId, data);

  // Record the audit event.
  await recordTaskAudit(
    userId,
    companyId,
    "TASK_UPDATED",
    taskId,
    {
      changedFields: Object.keys(data),
    },
  );

  // Track priority changes.
  if (data.priority !== undefined && data.priority !== task.priority) {
    await createTaskHistory({
      taskId,
      userId,
      action: "PRIORITY_CHANGED",
      oldValue: task.priority,
      newValue: data.priority,
    });
  }

  // Track assignee changes.
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

    // Notify the new assignee, but do not notify the acting user.
    if (data.assignedTo && data.assignedTo !== userId) {
      await notifyTaskAssignee(
        data.assignedTo,
        "Task Assigned to You",
        `You have been assigned the task: ${updatedTask.title}`,
        updatedTask.id,
      );
    }
  }

  // Track title changes.
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

// Change a task's status and notify active company administrators.
export const changeTaskStatus = async (
  taskId: string,
  companyId: string,
  userId: string,
  data: UpdateTaskStatusInput,
) => {
  const task = await findTaskById(taskId);

  if (!task || task.project.companyId !== companyId) {
    throw new Error("Task not found");
  }

  if (task.status === data.status) {
    throw new Error(`Task is already ${data.status}`);
  }

  const updatedTask = await updateTaskStatus(taskId, data.status);

  // Record task history.
  await createTaskHistory({
    taskId,
    userId,
    action: "STATUS_CHANGED",
    oldValue: task.status,
    newValue: data.status,
  });

  // Record the audit event.
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

  // Notify active administrators of the status change.
  try {
    const updatedBy = await findUserByIdAndCompany(userId, companyId);
    const { users: companyUsers } = await findUsersByCompany(companyId,
  {
    page: 1,
    limit: 100,
    sortBy: "createdAt",
    sortOrder: "desc",
  }
);

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

// Delete a task belonging to the specified company.
export const deleteCompanyTask = async (
  userId: string,
  taskId: string,
  companyId: string,
) => {
  const task = await findTaskById(taskId);

  if (!task || task.project.companyId !== companyId) {
    throw new Error("Task not found");
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

// Get task history after verifying company access.
export const getCompanyTaskHistory = async (
  taskId: string,
  companyId: string,
) => {
  const task = await findTaskById(taskId);

  if (!task || task.project.companyId !== companyId) {
    throw new Error("Task not found");
  }

  return findTaskHistory(taskId);
};
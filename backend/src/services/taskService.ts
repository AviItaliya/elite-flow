import {createTask, deleteTask, findTaskById, findTasksByProject, updateTask, updateTaskStatus} from "../repositories/taskRepository.js";
import {findProjectByIdAndCompany, findProjectMember} from "../repositories/projectRepository.js";
import { findUserByIdAndCompany } from "../repositories/userRepository.js";
import type {CreateTaskInput, UpdateTaskInput, UpdateTaskStatusInput} from "../validators/taskValidator.js";
import { createTaskHistory, findTaskHistory } from "../repositories/taskHistoryRepository.js";

export const getProjectTasks = async (projectId: string, companyId: string) => {
  const project = await findProjectByIdAndCompany(projectId, companyId);
  if (!project) {
    throw new Error("Project not found");
  }
  return findTasksByProject(projectId);
};

export const getCompanyTaskById = async (taskId: string, companyId: string) => {
  const task = await findTaskById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }
  if (task.project.companyId !== companyId) {
    throw new Error("Task not found");
  }
  return task;
};

export const createProjectTask = async (companyId: string, createdBy: string, data: CreateTaskInput) => {
  const project = await findProjectByIdAndCompany(data.projectId, companyId);
  if (!project) {
    throw new Error("Project not found");
  }
  if (project.status === "CANCELLED") {
    throw new Error(
      "Cannot create a task in a cancelled project"
    );
  }
  if (data.dueDate && data.dueDate < new Date()
  ) {
    throw new Error("Due date cannot be in the past");
  }
  if (data.assignedTo) {
    const user = await findUserByIdAndCompany(data.assignedTo, companyId    );
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

  const task = await createTask({
      projectId: data.projectId,
      createdBy,
      assignedTo: data.assignedTo,
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
    return task;
};

export const updateCompanyTask = async (taskId: string, companyId: string, userId: string, data: UpdateTaskInput) => {
  const task = await findTaskById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }
  if (task.project.companyId !== companyId) {
    throw new Error("Task not found");
  }
  if (data.dueDate && data.dueDate < new Date()) {
    throw new Error("Due date cannot be in the past");
  }
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
  const updatedTask = await updateTask(taskId, data);
  if (
    data.priority !== undefined &&
    data.priority !== task.priority
  ) {
    await createTaskHistory({
      taskId,
      userId,
      action: "PRIORITY_CHANGED",
      oldValue: task.priority,
      newValue: data.priority,
    });
  }
  if (
    data.assignedTo !== undefined &&
    data.assignedTo !== task.assignedTo
  ) {
    await createTaskHistory({
      taskId,
      userId,
      action: "ASSIGNEE_CHANGED",
      oldValue: task.assignedTo ?? "UNASSIGNED",
      newValue: data.assignedTo ?? "UNASSIGNED",
    });
  }
  if (
    data.title !== undefined &&
    data.title !== task.title
  ) {
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
  const task = await findTaskById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }
  if (task.project.companyId !== companyId) {
    throw new Error("Task not found");
  }
  if (task.status === data.status) {
    throw new Error(`Task is already ${data.status}`);
  }
  const updatedTask = await updateTaskStatus(taskId,data.status);
  await createTaskHistory({
    taskId,
    userId,
    action: "STATUS_CHANGED",
    oldValue: task.status,
    newValue: data.status,
  });
  return updatedTask;
};

export const deleteCompanyTask = async (taskId: string, companyId: string) => {
  const task = await findTaskById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }
  if (task.project.companyId !== companyId) {
    throw new Error("Task not found");
  }
  return deleteTask(taskId);
};

export const getCompanyTaskHistory = async (taskId: string, companyId: string) => {
  const task = await findTaskById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }
  if (task.project.companyId !== companyId) {
    throw new Error("Task not found");
  }
  return findTaskHistory(taskId);
};
import { NotificationType } from "../generated/prisma/enums.js";
import { createComment, deleteComment, findCommentById, findCommentsByTask, updateComment } from "../repositories/commentRepository.js";
import { findTaskById } from "../repositories/taskRepository.js"
import { findUserByIdAndCompany } from "../repositories/userRepository.js";
import { createNotification } from "./notificationService.js";

export const getTaskComments = async (taskId: string, companyId: string) => {
  const task = await findTaskById(taskId);
  if(!task) {
    throw new Error("Task not found");
  }
  if(task.project.companyId !== companyId) {
    throw new Error("Task not found");
  }
  return findCommentsByTask(taskId);
};

export const createTaskComment = async(taskId: string, userId: string, companyId: string, content: string) => {
  const task = await findTaskById(taskId);
  if(!task) {
    throw new Error("Task not found");
  }
  if(task.project.companyId !== companyId) {
    throw new Error("Task not found");
  }
  const comment = await createComment({taskId, userId, content});
  if(task.assignedTo && task.assignedTo !== userId) {
    try {
      const commenter = await findUserByIdAndCompany(userId, companyId);
      if(commenter) {
        await createNotification({
          userId: task.assignedTo,
          type: NotificationType.TASK_COMMENTED,
          title: "New Comment on Your Task",
          message: `${commenter.name} commented on task "${task.title}".`,
          link: `/tasks/${task.id}`
        });
      }
    } catch (error) {
      console.error("Failed to create task comment notification:", error);
    }
  }
  return comment;
};

export const updateTaskComment = async(commentId: string, userId: string, companyId: string, content: string) => {
  const comment = await findCommentById(commentId);
  if(!comment) {
    throw new Error("Comment not found");
  }
  if(comment.task.project.companyId !== companyId) {
    throw new Error("Comment not found");
  }
  if(comment.user.id !== userId) {
    throw new Error("You can only edit your own comments");
  }
  return updateComment(commentId, content);
};

export const deleteTaskComment = async(commentId: string, userId: string, companyId: string) => {
  const comment = await findCommentById(commentId);
  if(!comment) {
    throw new Error("Comment not found");
  }
  if(comment.task.project.companyId !== companyId) {
    throw new Error("Comment not found");
  }
  if(comment.user.id !== userId) {
    throw new Error("You can only delete your own comments");
  }
  return deleteComment(commentId);
};
import {createComment, deleteComment, findCommentById, findCommentsByTask, updateComment} from "../repositories/commentRepository.js";
import { findTaskById } from "../repositories/taskRepository.js";

export const getTaskComments = async (taskId: string, companyId: string) => {
  const task = await findTaskById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }
  if (task.project.companyId !== companyId) {
    throw new Error("Task not found");
  }
  return findCommentsByTask(taskId);
};

export const createTaskComment = async (
  taskId: string,
  userId: string,
  companyId: string,
  content: string
) => {
  const task = await findTaskById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }
  if (task.project.companyId !== companyId) {
    throw new Error("Task not found");
  }
  return createComment({
    taskId,
    userId,
    content,
  });
};

export const updateTaskComment = async (
  commentId: string,
  userId: string,
  companyId: string,
  content: string
) => {
  const comment = await findCommentById(commentId);
  if (!comment) {
    throw new Error("Comment not found");
  }
  if (comment.task.project.companyId !== companyId) {
    throw new Error("Comment not found");
  }
  if (comment.user.id !== userId) {
    throw new Error("You can only edit your own comments");
  }
  return updateComment(commentId, content);
};

export const deleteTaskComment = async (
  commentId: string,
  userId: string,
  companyId: string
) => {
  const comment = await findCommentById(commentId);
  if (!comment) {
    throw new Error("Comment not found");
  }
  if (comment.task.project.companyId !== companyId) {
    throw new Error("Comment not found");
  }
  if (comment.user.id !== userId) {
    throw new Error("You can only delete your own comments");
  }
  return deleteComment(commentId);
};
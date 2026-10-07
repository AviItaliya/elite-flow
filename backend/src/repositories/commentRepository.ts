import { prisma } from "../config/database.js";

export const findCommentsByTask = async (taskId: string) =>
  prisma.comment.findMany({
    where: { taskId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

export const findCommentById = async (commentId: string) =>
  prisma.comment.findUnique({
    where: {
      id: commentId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      task: {
        include: {
          project: true,
        },
      },
    },
  });

export const createComment = async (data: {
  taskId: string;
  userId: string;
  content: string;
}) =>
  prisma.comment.create({
    data: {
      taskId: data.taskId,
      userId: data.userId,
      content: data.content,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

export const updateComment = async (commentId: string, content: string) =>
  prisma.comment.update({
    where: {
      id: commentId,
    },
    data: {
      content,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

export const deleteComment = async (commentId: string) =>
  prisma.comment.delete({
    where: {
      id: commentId,
    },
  });
import { prisma } from "../config/database.js";

export const createTaskHistory = async (data: {
  taskId: string;
  userId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
}) =>
  prisma.taskHistory.create({
    data: {
      taskId: data.taskId,
      userId: data.userId,
      action: data.action,
      oldValue: data.oldValue,
      newValue: data.newValue,
    },
  });

export const findTaskHistory = async (taskId: string) =>
  prisma.taskHistory.findMany({
    where: {
      taskId,
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
    orderBy: {
      createdAt: "desc",
    },
  });
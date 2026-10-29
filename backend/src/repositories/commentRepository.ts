import { prisma } from "../config/database.js";

export type CommentSortOrder = "asc" | "desc";

export interface CommentListFilters {
  page: number;
  limit: number;
  search?: string;
  sortOrder: CommentSortOrder;
}

export const findCommentsByTask = async (taskId: string, filters: CommentListFilters) => {
  const where = {
    taskId,
    ...(filters.search
      ? {
          content: {
            contains: filters.search,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };
  const skip = (filters.page - 1) * filters.limit;
  const [comments, total] = await prisma.$transaction([
    prisma.comment.findMany({
      where,
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
      orderBy: [
        { createdAt: filters.sortOrder },
        { id: "asc" },
      ],
      skip,
      take: filters.limit,
    }),
    prisma.comment.count({ where }),
  ]);
  return {
    comments,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
};

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
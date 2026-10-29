import { prisma } from "../config/database.js";

type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type TaskSortField = "createdAt" | "updatedAt" | "title" | "dueDate";
type TaskSortOrder = "asc" | "desc";

export interface TaskListFilters {
  page: number;
  limit: number;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  sortBy: TaskSortField;
  sortOrder: TaskSortOrder;
}

export const findTasksByProject = async (projectId: string, filters: TaskListFilters) => {
  const {page, limit, search, status, priority, sortBy, sortOrder} = filters;
  const where = {
    projectId,
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };
  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {[sortBy]: sortOrder},
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.task.count({where}),
  ]);
  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const findTaskById = async (taskId: string) => {
  return prisma.task.findUnique({
    where: {
      id: taskId,
    },
    include: {
      project: true,
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      comments: {
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
          createdAt: "asc",
        },
      },
      history: {
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
      },
    },
  });
};

export const createTask = async (data: {
  projectId: string;
  createdBy: string;
  assignedTo?: string;
  title: string;
  description?: string;
  priority?:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "URGENT";
  dueDate?: Date;
}) => {
  return prisma.task.create({
    data: {
      projectId: data.projectId,
      createdBy: data.createdBy,
      assignedTo: data.assignedTo,
      title: data.title,
      description: data.description,
      priority: data.priority ?? "MEDIUM",
      dueDate: data.dueDate,
    },
  });
};

export const updateTask = async (
  taskId: string,
  data: {
    title?: string;
    description?: string;
    assignedTo?: string | null;
    priority?:
      | "LOW"
      | "MEDIUM"
      | "HIGH"
      | "URGENT";
    dueDate?: Date | null;
  }
) => {
  return prisma.task.update({
    where: {
      id: taskId,
    },
    data,
  });
};

export const updateTaskStatus = async (
  taskId: string,
  status:
    | "TODO"
    | "IN_PROGRESS"
    | "REVIEW"
    | "COMPLETED"
) => {
  return prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      status,
    },
  });
};

export const deleteTask = async (taskId: string) => {
  return prisma.task.delete({
    where: {
      id: taskId,
    },
  });
};
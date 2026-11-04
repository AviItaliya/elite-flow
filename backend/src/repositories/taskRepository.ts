
import { prisma } from "../config/database.js";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "DONE"
  | "TESTING"
  | "QA_VERIFIED"
  | "RE_OPEN"
  | "DEPLOYMENT";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

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

export const findTasksByProject = async (
  projectId: string,
  filters: TaskListFilters,
) => {
  const {
    page,
    limit,
    search,
    status,
    priority,
    sortBy,
    sortOrder,
  } = filters;

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
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.task.count({ where }),
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
      project: {
        select: {
          id: true,
          companyId: true,
          name: true,
          status: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
      reporter: {
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
  reportedTo?: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
}) => {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.update({
      where: {
        id: data.projectId,
      },
      data: {
        taskSequence: {
          increment: 1,
        },
      },
      select: {
        taskCodePrefix: true,
        taskSequence: true,
      },
    });

    const taskCode = `${project.taskCodePrefix}-${String(
      project.taskSequence,
    ).padStart(2, "0")}`;

    return tx.task.create({
      data: {
        taskCode,
        projectId: data.projectId,
        createdBy: data.createdBy,
        assignedTo: data.assignedTo,
        reportedTo: data.reportedTo,
        title: data.title,
        description: data.description,
        priority: data.priority ?? "MEDIUM",
        dueDate: data.dueDate,
      },
    });
  });
};

export const updateTask = async (
  taskId: string,
  data: {
    title?: string;
    description?: string | null;
    assignedTo?: string | null;
    reportedTo?: string | null;
    priority?: TaskPriority;
    dueDate?: Date | null;
  },
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
  status: TaskStatus,
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

import { prisma } from "../config/database.js";

export const findTasksByProject = async (projectId: string) => {
  return prisma.task.findMany({
    where: {
      projectId,
    },
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
    orderBy: {
      createdAt: "desc",
    },
  });
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
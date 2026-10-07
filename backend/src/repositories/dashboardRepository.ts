import { prisma } from "../config/database.js";

export const getUserStats = async (companyId: string) => {
  const [total, active, inactive] = await Promise.all([
    prisma.user.count({
      where: {
        companyId,
        deletedAt: null,
      },
    }),

    prisma.user.count({
      where: {
        companyId,
        status: "ACTIVE",
        deletedAt: null,
      },
    }),

    prisma.user.count({
      where: {
        companyId,
        status: "INACTIVE",
        deletedAt: null,
      },
    }),
  ]);

  return {
    total,
    active,
    inactive,
  };
};

export const getProjectStats = async (companyId: string) => {
  const [
    total,
    planning,
    active,
    completed,
    onHold,
    cancelled,
  ] = await Promise.all([
    prisma.project.count({
      where: {
        companyId,
      },
    }),

    prisma.project.count({
      where: {
        companyId,
        status: "PLANNING",
      },
    }),

    prisma.project.count({
      where: {
        companyId,
        status: "ACTIVE",
      },
    }),

    prisma.project.count({
      where: {
        companyId,
        status: "COMPLETED",
      },
    }),

    prisma.project.count({
      where: {
        companyId,
        status: "ON_HOLD",
      },
    }),

    prisma.project.count({
      where: {
        companyId,
        status: "CANCELLED",
      },
    }),
  ]);

  return {
    total,
    planning,
    active,
    completed,
    onHold,
    cancelled,
  };
};

export const getTaskStats = async (companyId: string) => {
  const [
    total,
    todo,
    inProgress,
    review,
    completed,
    low,
    medium,
    high,
    urgent,
  ] = await Promise.all([
    prisma.task.count({
      where: {
        project: {
          companyId,
        },
      },
    }),

    prisma.task.count({
      where: {
        project: {
          companyId,
        },
        status: "TODO",
      },
    }),

    prisma.task.count({
      where: {
        project: {
          companyId,
        },
        status: "IN_PROGRESS",
      },
    }),

    prisma.task.count({
      where: {
        project: {
          companyId,
        },
        status: "REVIEW",
      },
    }),

    prisma.task.count({
      where: {
        project: {
          companyId,
        },
        status: "COMPLETED",
      },
    }),

    prisma.task.count({
      where: {
        project: {
          companyId,
        },
        priority: "LOW",
      },
    }),

    prisma.task.count({
      where: {
        project: {
          companyId,
        },
        priority: "MEDIUM",
      },
    }),

    prisma.task.count({
      where: {
        project: {
          companyId,
        },
        priority: "HIGH",
      },
    }),

    prisma.task.count({
      where: {
        project: {
          companyId,
        },
        priority: "URGENT",
      },
    }),
  ]);

  return {
    total,

    status: {
      todo,
      inProgress,
      review,
      completed,
    },

    priority: {
      low,
      medium,
      high,
      urgent,
    },
  };
};

export const getRecentProjects = async (companyId: string) => {
  return prisma.project.findMany({
    where: {
      companyId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      startDate: true,
      endDate: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });
};

export const getRecentTasks = async (companyId: string) => {
  return prisma.task.findMany({
    where: {
      project: {
        companyId,
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      createdAt: true,

      project: {
        select: {
          id: true,
          name: true,
        },
      },

      assignee: {
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
    take: 5,
  });
};

export const getTaskStatusDistribution = async (companyId: string) => {
  const [todo, inProgress, review, completed] = await Promise.all([
    prisma.task.count({
      where: {
        project: { companyId },
        status: "TODO",
      },
    }),

    prisma.task.count({
      where: {
        project: { companyId },
        status: "IN_PROGRESS",
      },
    }),

    prisma.task.count({
      where: {
        project: { companyId },
        status: "REVIEW",
      },
    }),

    prisma.task.count({
      where: {
        project: { companyId },
        status: "COMPLETED",
      },
    }),
  ]);

  return {
    todo,
    inProgress,
    review,
    completed,
  };
};

export const getProjectStatusDistribution = async (companyId: string) => {
  const [
    planning,
    active,
    completed,
    onHold,
    cancelled,
  ] = await Promise.all([
    prisma.project.count({
      where: {
        companyId,
        status: "PLANNING",
      },
    }),

    prisma.project.count({
      where: {
        companyId,
        status: "ACTIVE",
      },
    }),

    prisma.project.count({
      where: {
        companyId,
        status: "COMPLETED",
      },
    }),

    prisma.project.count({
      where: {
        companyId,
        status: "ON_HOLD",
      },
    }),

    prisma.project.count({
      where: {
        companyId,
        status: "CANCELLED",
      },
    }),
  ]);

  return {
    planning,
    active,
    completed,
    onHold,
    cancelled,
  };
};
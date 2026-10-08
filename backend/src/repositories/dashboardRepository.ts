import { prisma } from "../config/database.js";

export const getCompanyUserStats = async (companyId: string) => {
  const [
    total,
    active,
    inactive,
    admins,
    normalUsers,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        companyId,
        role: {
          in: ["ADMIN", "USER"],
        },
        deletedAt: null,
      },
    }),

    prisma.user.count({
      where: {
        companyId,
        role: {
          in: ["ADMIN", "USER"],
        },
        status: "ACTIVE",
        deletedAt: null,
      },
    }),

    prisma.user.count({
      where: {
        companyId,
        role: {
          in: ["ADMIN", "USER"],
        },
        status: "INACTIVE",
        deletedAt: null,
      },
    }),

    prisma.user.count({
      where: {
        companyId,
        role: "ADMIN",
        deletedAt: null,
      },
    }),

    prisma.user.count({
      where: {
        companyId,
        role: "USER",
        deletedAt: null,
      },
    }),
  ]);

  return {
    total,
    active,
    inactive,
    admins,
    normalUsers,
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
      where: { companyId },
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
    overdue,
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

    prisma.task.count({
      where: {
        project: {
          companyId,
        },
        dueDate: {
          lt: new Date(),
        },
        status: {
          not: "COMPLETED",
        },
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

    overdue,
  };
};

export const getRecentUsers = async (companyId: string) => {
  return prisma.user.findMany({
    where: {
      companyId,
      deletedAt: null,
      role: {
        in: ["ADMIN", "USER"],
      },
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 5,
  });
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

export const getRecentComments = async (companyId: string) => {
  return prisma.comment.findMany({
    where: {
      task: {
        project: {
          companyId,
        },
      },
    },

    select: {
      id: true,
      content: true,
      createdAt: true,

      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      task: {
        select: {
          id: true,
          title: true,

          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 5,
  });
};

export const getRecentTaskActivity = async (companyId: string) => {
  return prisma.taskHistory.findMany({
    where: {
      task: {
        project: {
          companyId,
        },
      },
    },

    select: {
      id: true,
      action: true,
      oldValue: true,
      newValue: true,
      createdAt: true,

      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      task: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 5,
  });
};

export const getUserTaskStats = async (
  userId: string,
  companyId: string,
) => {
  const [
    assigned,
    todo,
    inProgress,
    review,
    completed,
    overdue,
  ] = await Promise.all([
    prisma.task.count({
      where: {
        assignedTo: userId,
        project: {
          companyId,
        },
      },
    }),

    prisma.task.count({
      where: {
        assignedTo: userId,
        project: {
          companyId,
        },
        status: "TODO",
      },
    }),

    prisma.task.count({
      where: {
        assignedTo: userId,
        project: {
          companyId,
        },
        status: "IN_PROGRESS",
      },
    }),

    prisma.task.count({
      where: {
        assignedTo: userId,
        project: {
          companyId,
        },
        status: "REVIEW",
      },
    }),

    prisma.task.count({
      where: {
        assignedTo: userId,
        project: {
          companyId,
        },
        status: "COMPLETED",
      },
    }),

    prisma.task.count({
      where: {
        assignedTo: userId,
        project: {
          companyId,
        },
        dueDate: {
          lt: new Date(),
        },
        status: {
          not: "COMPLETED",
        },
      },
    }),
  ]);

  return {
    assigned,
    todo,
    inProgress,
    review,
    completed,
    overdue,
  };
};

export const getUserProjectStats = async (
  userId: string,
  companyId: string,
) => {
  const [
    total,
    active,
    completed,
  ] = await Promise.all([
    prisma.project.count({
      where: {
        companyId,
        members: {
          some: {
            userId,
          },
        },
      },
    }),

    prisma.project.count({
      where: {
        companyId,
        status: "ACTIVE",
        members: {
          some: {
            userId,
          },
        },
      },
    }),

    prisma.project.count({
      where: {
        companyId,
        status: "COMPLETED",
        members: {
          some: {
            userId,
          },
        },
      },
    }),
  ]);

  return {
    total,
    active,
    completed,
  };
};

export const getUserRecentTasks = async (
  userId: string,
  companyId: string,
) => {
  return prisma.task.findMany({
    where: {
      assignedTo: userId,
      project: {
        companyId,
      },
    },

    select: {
      id: true,
      title: true,
      description: true,
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
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 5,
  });
};

export const getUserRecentComments = async (
  userId: string,
  companyId: string,
) => {
  return prisma.comment.findMany({
    where: {
      userId,
      task: {
        project: {
          companyId,
        },
      },
    },

    select: {
      id: true,
      content: true,
      createdAt: true,

      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 5,
  });
};

export const getUserRecentActivity = async (
  userId: string,
  companyId: string,
) => {
  return prisma.taskHistory.findMany({
    where: {
      userId,
      task: {
        project: {
          companyId,
        },
      },
    },

    select: {
      id: true,
      action: true,
      oldValue: true,
      newValue: true,
      createdAt: true,

      task: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 5,
  });
};

export const getUserProjects = async (
  userId: string,
  companyId: string,
) => {
  return prisma.project.findMany({
    where: {
      companyId,
      status: "ACTIVE",
      members: {
        some: {
          userId,
        },
      },
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
  });
};

export const getSuperadminStats = async () => {
  const [
    totalCompanies,
    activeCompanies,
    inactiveCompanies,
    totalUsers,
    totalAdmins,
    totalRegularUsers,
    totalProjects,
    totalTasks,
  ] = await Promise.all([
    prisma.company.count(),

    prisma.company.count({
      where: {
        isActive: true,
      },
    }),

    prisma.company.count({
      where: {
        isActive: false,
      },
    }),

    prisma.user.count({
      where: {
        deletedAt: null,
      },
    }),

    prisma.user.count({
      where: {
        role: "ADMIN",
        deletedAt: null,
      },
    }),

    prisma.user.count({
      where: {
        role: "USER",
        deletedAt: null,
      },
    }),

    prisma.project.count(),

    prisma.task.count(),
  ]);

  return {
    companies: {
      total: totalCompanies,
      active: activeCompanies,
      inactive: inactiveCompanies,
    },

    users: {
      total: totalUsers,
      admins: totalAdmins,
      users: totalRegularUsers,
    },

    projects: {
      total: totalProjects,
    },

    tasks: {
      total: totalTasks,
    },
  };
};

export const getSubscriptionStats = async () => {
  const [
    total,
    active,
    trial,
    expired,
    cancelled,
  ] = await Promise.all([
    prisma.subscription.count(),

    prisma.subscription.count({
      where: {
        status: "ACTIVE",
      },
    }),

    prisma.subscription.count({
      where: {
        status: "TRIAL",
      },
    }),

    prisma.subscription.count({
      where: {
        status: "EXPIRED",
      },
    }),

    prisma.subscription.count({
      where: {
        status: "CANCELLED",
      },
    }),
  ]);

  return {
    total,
    active,
    trial,
    expired,
    cancelled,
  };
};

export const getRecentCompanies = async () => {
  return prisma.company.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,

      _count: {
        select: {
          users: true,
          projects: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 5,
  });
};

export const getAdminTaskAnalytics = async (companyId: string) => {
  const [
    total,
    pending,
    inProgress,
    completed,
    cancelled,
    overdue,
    low,
    medium,
    high,
    urgent,
  ] = await Promise.all([
    prisma.task.count({
      where: { project: { companyId } },
    }),

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

    prisma.task.count({
      where: {
        project: { companyId },
        dueDate: {
          lt: new Date(),
        },
        status: {
          not: "COMPLETED",
        },
      },
    }),

    prisma.task.count({
      where: {
        project: { companyId },
        priority: "LOW",
      },
    }),

    prisma.task.count({
      where: {
        project: { companyId },
        priority: "MEDIUM",
      },
    }),

    prisma.task.count({
      where: {
        project: { companyId },
        priority: "HIGH",
      },
    }),

    prisma.task.count({
      where: {
        project: { companyId },
        priority: "URGENT",
      },
    }),
  ]);

  return {
    total,
    status: {
      pending,
      inProgress,
      completed,
      cancelled,
    },
    overdue,
    priority: {
      low,
      medium,
      high,
      urgent,
    },
  };
};

export const getAdminProjectAnalytics = async (companyId: string) => {
  const [
    total,
    active,
    completed,
  ] = await Promise.all([
    prisma.project.count({
      where: {
        companyId,
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
  ]);

  return {
    total,
    active,
    completed,
  };
};
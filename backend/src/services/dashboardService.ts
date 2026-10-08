import {
  getProjectStats,
  getTaskStats,
  getRecentProjects,
  getRecentTasks,

  getSuperadminStats,
  getSubscriptionStats,
  getRecentCompanies,

  getUserTaskStats,
  getUserProjectStats,
  getUserRecentTasks,
  getUserRecentComments,
  getUserRecentActivity,
  getUserProjects,

  getCompanyUserStats,
  getRecentUsers,
  getRecentComments,
  getRecentTaskActivity,

  getAdminTaskAnalytics,
  getAdminProjectAnalytics,
} from "../repositories/dashboardRepository.js";

import { prisma } from "../config/database.js";

export const getSuperadminDashboard = async () => {
  const [
    stats,
    subscriptions,
    recentCompanies,
  ] = await Promise.all([
    getSuperadminStats(),
    getSubscriptionStats(),
    getRecentCompanies(),
  ]);

  return {
    ...stats,
    subscriptions,
    recentCompanies,
  };
};

export const getAdminDashboard = async (companyId: string) => {
  const [
    userStats,
    projectStats,
    taskStats,
    taskAnalytics,
    projectAnalytics,
    recentProjects,
    recentTasks,
  ] = await Promise.all([
    getCompanyUserStats(companyId),
    getProjectStats(companyId),
    getTaskStats(companyId),
    getAdminTaskAnalytics(companyId),
    getAdminProjectAnalytics(companyId),
    getRecentProjects(companyId),
    getRecentTasks(companyId),
  ]);

  return {
    users: userStats,

    projects: {
      ...projectStats,
      analytics: projectAnalytics,
    },

    tasks: {
      ...taskStats,
      analytics: taskAnalytics,
    },

    recentProjects,
    recentTasks,
  };
};

export const getUserDashboard = async (
  userId: string,
  companyId: string,
) => {
  const [
    tasks,
    projects,
    recentTasks,
    recentComments,
    recentActivity,
    myProjects,
    company,
    user,
  ] = await Promise.all([
    getUserTaskStats(userId, companyId),
    getUserProjectStats(userId, companyId),
    getUserRecentTasks(userId, companyId),
    getUserRecentComments(userId, companyId),
    getUserRecentActivity(userId, companyId),
    getUserProjects(userId, companyId),

    prisma.company.findUnique({
      where: {
        id: companyId,
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
      },
    }),

    prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        companyId: true,
      },
    }),
  ]);

  const [
    myCommentsCount,
    myTaskActivityCount,
  ] = await Promise.all([
    prisma.comment.count({
      where: {
        userId,
        task: {
          project: {
            companyId,
          },
        },
      },
    }),

    prisma.taskHistory.count({
      where: {
        userId,
        task: {
          project: {
            companyId,
          },
        },
      },
    }),
  ]);

  return {
    role: "USER",

    stats: {
      tasks: {
        ...tasks,
      },

      projects: {
        ...projects,
      },

      engagement: {
        myCommentsCount,
        myTaskActivityCount,
      },
    },

    profile: user,

    company,

    projects: myProjects,

    recentTasks,
    recentComments,
    recentTaskActivity: recentActivity,
  };
};
import {
  getProjectStats,
  getTaskStats,
  getUserStats,
  getRecentProjects,
  getRecentTasks,
} from "../repositories/dashboardRepository.js";

export const getAdminDashboard = async (companyId: string) => {
  const [
    users,
    projects,
    tasks,
    recentProjects,
    recentTasks,
  ] = await Promise.all([
    getUserStats(companyId),
    getProjectStats(companyId),
    getTaskStats(companyId),
    getRecentProjects(companyId),
    getRecentTasks(companyId),
  ]);

  return {
    users,
    projects,
    tasks,

    recentProjects,
    recentTasks,

    taskStatusDistribution: tasks.status,
    projectStatusDistribution: {
      planning: projects.planning,
      active: projects.active,
      completed: projects.completed,
      onHold: projects.onHold,
      cancelled: projects.cancelled,
    },
  };
};
import { prisma } from "../config/database.js";

export const findProjectsByCompany = async (companyId: string) => {
  return prisma.project.findMany({
    where: {
      companyId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findProjectByIdAndCompany = async (
  projectId: string,
  companyId: string
) => {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      companyId,
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
      },
    },
  });
};

export const createProject = async (data: {
  companyId: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  return prisma.project.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
    },
  });
};

export const updateProject = async (
  projectId: string,
  data: {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
  }
) => {
  return prisma.project.update({
    where: {
      id: projectId,
    },
    data,
  });
};

export const updateProjectStatus = async (
  projectId: string,
  status:
    | "PLANNING"
    | "ACTIVE"
    | "COMPLETED"
    | "ON_HOLD"
    | "CANCELLED"
) => {
  return prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      status,
    },
  });
};

export const deleteProject = async (projectId: string) => {
  return prisma.project.delete({
    where: {
      id: projectId,
    },
  });
};

export const findProjectMember = async (
  projectId: string,
  userId: string
) => {
  return prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
};

export const findProjectMembers = async (projectId: string) => {
  return prisma.projectMember.findMany({
    where: {
      projectId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const addProjectMember = async (
  projectId: string,
  userId: string
) => {
  return prisma.projectMember.create({
    data: {
      projectId,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });
};

export const removeProjectMember = async (
  projectId: string,
  userId: string
) => {
  return prisma.projectMember.delete({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
};
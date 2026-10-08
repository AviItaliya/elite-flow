import {addProjectMember, countCompanyProjects, createProject, deleteProject, findProjectByIdAndCompany, findProjectMember, findProjectMembers, findProjectsByCompany, removeProjectMember, updateProject, updateProjectStatus} from "../repositories/projectRepository.js";
import { findUserByIdAndCompany } from "../repositories/userRepository.js";
import type {CreateProjectInput, UpdateProjectInput, UpdateProjectStatusInput} from "../validators/projectValidator.js";
import { requireActiveSubscription } from "./subscriptionService.js";

export const getCompanyProjects = async (companyId: string) => {
  return findProjectsByCompany(companyId);
};

export const getCompanyProjectById = async (projectId: string, companyId: string) => {
  const project = await findProjectByIdAndCompany(projectId, companyId);
  if (!project) {
    throw new Error("Project not found");
  }
  return project;
};

export const createCompanyProject = async (companyId: string, data: CreateProjectInput) => {
  const subscription = await requireActiveSubscription(companyId);
  const currentProjectCount = await countCompanyProjects(companyId);
  if (currentProjectCount >= subscription.plan.maxProjects) {
    throw new Error(`Project limit reached for your current plan. Maximum projects allowed: ${subscription.plan.maxProjects}`);
  }
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    throw new Error("End date cannot be before start date");
  }
  return createProject({
    companyId,
    name: data.name,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
  });
};

export const updateCompanyProject = async (projectId: string, companyId: string, data: UpdateProjectInput) => {
  const project = await findProjectByIdAndCompany(projectId, companyId);
  if (!project) {
    throw new Error("Project not found");
  }
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    throw new Error("End date cannot be before start date");
  }
  if (data.startDate && !data.endDate && project.endDate && project.endDate < data.startDate) {
    throw new Error("Start date cannot be after end date");
  }
  if (data.endDate && !data.startDate && project.startDate && data.endDate < project.startDate) {
    throw new Error("End date cannot be before start date");
  }
  return updateProject(projectId, data);
};

export const changeProjectStatus = async (projectId: string, companyId: string, data: UpdateProjectStatusInput) => {
  const project = await findProjectByIdAndCompany(projectId, companyId);
  if (!project) {
    throw new Error("Project not found");
  }
  if (project.status === data.status) {
    throw new Error(`Project is already ${data.status}`);
  }
  return updateProjectStatus(projectId, data.status);
};

export const deleteCompanyProject = async (projectId: string, companyId: string) => {
  const project = await findProjectByIdAndCompany(projectId, companyId);
  if (!project) {
    throw new Error("Project not found");
  }
  return deleteProject(projectId);
};

export const getProjectMembers = async (projectId: string, companyId: string) => {
  const project = await findProjectByIdAndCompany(projectId, companyId);
  if (!project) {
    throw new Error("Project not found");
  }
  return findProjectMembers(projectId);
};

export const addMemberToProject = async (projectId: string, companyId: string, userId: string) => {
  const project = await findProjectByIdAndCompany(projectId, companyId);
  if (!project) {
    throw new Error("Project not found");
  }
  const user = await findUserByIdAndCompany(userId, companyId);
  if (!user) {
    throw new Error(
      "User not found in your company"
    );
  }
  if (user.status !== "ACTIVE") {
    throw new Error(
      "Inactive users cannot be added to a project"
    );
  }
  const existingMember = await findProjectMember(projectId, userId);
  if (existingMember) {
    throw new Error(
      "User is already a project member"
    );
  }
  return addProjectMember(projectId, userId);
};

export const removeMemberFromProject = async (projectId: string, companyId: string, userId: string) => {
  const project = await findProjectByIdAndCompany(projectId, companyId  );
  if (!project) {
    throw new Error("Project not found");
  }
  const member = await findProjectMember(projectId,userId  );
  if (!member) {
    throw new Error("Project member not found");
  }
  return removeProjectMember(projectId, userId);
};
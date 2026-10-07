import { Request, Response } from "express";
import {createProjectSchema, projectMemberSchema, updateProjectSchema, updateProjectStatusSchema} from "../validators/projectValidator.js";
import {createCompanyProject, deleteCompanyProject, getCompanyProjectById, getCompanyProjects, updateCompanyProject, changeProjectStatus, getProjectMembers, addMemberToProject, removeMemberFromProject} from "../services/projectService.js";
import { getRequiredCompanyId } from "../utils/company.js";
import { getParamId } from "../utils/request.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export const getProjects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getRequiredCompanyId(req as any);
    const projects = await getCompanyProjects(companyId);
    return res.status(200).json({
      success: true,
      data: {
        projects,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to get projects",
    });
  }
};

export const getProjectById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getRequiredCompanyId(req as any);
    const projectId = getParamId(req);
    const project = await getCompanyProjectById(projectId, companyId);
    return res.status(200).json({
      success: true,
      data: {
        project,
      },
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Project not found",
    });
  }
};

export const createProjectController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getRequiredCompanyId(req as any);
    const data = createProjectSchema.parse(req.body);
    const project = await createCompanyProject(companyId, data);
    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: {
        project,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create project",
    });
  }
};

export const updateProjectController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getRequiredCompanyId(req as any);
    const projectId = getParamId(req);
    const data = updateProjectSchema.parse(req.body);
    const project = await updateCompanyProject(
      projectId,
      companyId,
      data
    );
    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: {
        project,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update project",
    });
  }
};

export const updateProjectStatusController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getRequiredCompanyId(req as any);
    const projectId = getParamId(req);
    const data = updateProjectStatusSchema.parse(req.body);
    const project = await changeProjectStatus(
      projectId,
      companyId,
      data
    );
    return res.status(200).json({
      success: true,
      message: "Project status updated successfully",
      data: {
        project,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update project status",
    });
  }
};

export const deleteProjectController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getRequiredCompanyId(req as any);
    const projectId = getParamId(req);
    await deleteCompanyProject(projectId, companyId);
    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete project",
    });
  }
};

export const getProjectMembersController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getRequiredCompanyId(req);
    const projectId = getParamId(req);
    const members = await getProjectMembers(projectId, companyId);
    return res.status(200).json({
      success: true,
      data: {
        members,
      },
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to get project members",
    });
  }
};

export const addProjectMemberController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getRequiredCompanyId(req);
    const projectId = getParamId(req);
    const data = projectMemberSchema.parse(req.body);
    const member = await addMemberToProject(projectId, companyId, data.userId);
    return res.status(201).json({
      success: true,
      message: "Project member added successfully",
      data: {
        member,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to add project member",
    });
  }
};

export const removeProjectMemberController = async ( req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getRequiredCompanyId(req);
    const projectId = getParamId(req);
    const { userId } = req.params;
    if (typeof userId !== "string" || !userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    await removeMemberFromProject(projectId, companyId, userId);
    return res.status(200).json({
      success: true,
      message: "Project member removed successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to remove project member",
    });
  }
};



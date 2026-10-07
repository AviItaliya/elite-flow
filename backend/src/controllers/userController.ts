import type { Response } from "express";
import { getParamId } from "../utils/request.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { changeUserStatus, createManagedUser, deleteManagedUser, getCompanyUserById, getCompanyUsers, getCurrentUser, updateManagedUser } from "../services/userService.js";
import { createUserSchema, updateUserSchema, updateUserStatusSchema } from "../validators/userValidator.js";
import { getRequiredCompanyId } from "../utils/company.js";

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if(!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const user = await getCurrentUser(req.user.userId);
        return res.status(200).json({
            success: true,
            message: "User profile fetched successfully",
            data: user
        });
    } catch (error) {
        if(error instanceof Error) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const getUsers = async (req:AuthenticatedRequest, res: Response) => {
    try {
        if(!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        if(!req.user.companyId) {
            return res.status(400).json({
                success: false,
                message: "User is not assigned with a company",
            });
        }
        const companyId = getRequiredCompanyId(req);
        const users = await getCompanyUsers(companyId);
        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: users
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const getUSerById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if(!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        if(!req.user.companyId) {
            return res.status(400).json({
                success: false,
                message: "User is not associated with a company",
            });
        }
        const userId = getParamId(req);
        const user = await getCompanyUserById(userId, req.user.companyId);
        return res.status(200).json({
            success: true,
            message: "User fetched successfully",
            data: user,
        });
    } catch (error) {
        if(error instanceof Error) {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const createUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if(!req.user) {
            return res.status(401).json({
              success: false,
              message: "Authentication required",  
            });
        }
        if(!req.user.companyId) {
            return res.status(400).json({
                success: false,
                message: "User is not associated with a company"
            });
        }
        const data = createUserSchema.parse(req.body);
        const user = await createManagedUser(data, req.user.companyId, req.user.role as "ADMIN" | "SUPERADMIN");
        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: user
        });
    } catch (error) {
        if(error instanceof Error) {
            return res.status(400).json({
                succes: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if(!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }
        if(!req.user.companyId) {
            return res.status(400).json({
                success: false,
                message: "User is not associated with a company"
            });
        }
        const data = updateUserSchema.parse(req.body);
        const userId = getParamId(req);
        const user = await updateManagedUser(userId, req.user.companyId, data, req.user.role as "ADMIN" | "SUPERADMIN");
        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user
        });
    } catch (error) {
        if(error instanceof Error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};

export const updateUserStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if(!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }
        if(!req.user.companyId) {
            return res.status(400).json({
                success: false,
                message: "User is not associated with a company"
            });
        }
        const data = updateUserStatusSchema.parse(req.body);
        const userId = getParamId(req);
        const user = await changeUserStatus(
            userId,
            req.user.companyId,
            data,
            req.user.userId,
            req.user.role as "ADMIN" | "SUPERADMIN"
        );
        return res.status(200).json({
            success: true,
            message: "User status updated successfully",
            data: user,
        });
    } catch (error) {
        if(error instanceof Error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }      
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!req.user.companyId) {
      return res.status(400).json({
        success: false,
        message:
          "User is not associated with a company",
      });
    }
    const userId = getParamId(req);
    const user = await deleteManagedUser(
      userId,
      req.user.companyId,
      req.user.userId,
      req.user.role as "ADMIN" | "SUPERADMIN"
    );

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: user,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
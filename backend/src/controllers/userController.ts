import type { Response } from "express";
import { getParamId } from "../utils/request.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { changeUserStatus, createManagedUser, deleteManagedUser, getCompanyUserById, getCompanyUsers, getCurrentUser, removeCurrentUserProfileImage, updateCurrentUserProfileImage, updateManagedUser } from "../services/userService.js";
import { createUserSchema, updateUserSchema, updateUserStatusSchema } from "../validators/userValidator.js";
import { getRequiredCompanyId } from "../utils/company.js";
import { CompanyUserRole, CompanyUserStatus, UserListFilters, UserSortField, UserSortOrder } from "../repositories/userRepository.js";

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

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
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
        message: "User is not assigned with a company",
      });
    }
    const companyId = getRequiredCompanyId(req);
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
    const role = req.query.role;
    const status = req.query.status;
    const sortBy = req.query.sortBy ?? "createdAt";
    const sortOrder = req.query.sortOrder ?? "desc";
    if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }
    if (search !== undefined && search.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Search cannot exceed 200 characters",
      });
    }
    const allowedRoles: CompanyUserRole[] = ["ADMIN", "USER"];
    const allowedStatuses: CompanyUserStatus[] = ["ACTIVE", "INACTIVE"];
    if (role !== undefined && (typeof role !== "string" || !allowedRoles.includes(role as CompanyUserRole))) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }
    if (status !== undefined && (typeof status !== "string" || !allowedStatuses.includes(status as CompanyUserStatus))) {
      return res.status(400).json({
        success: false,
        message: "Invalid user status",
      });
    }
    const allowedSortFields: UserSortField[] = ["createdAt", "updatedAt", "name", "email"];
    if (typeof sortBy !== "string" || !allowedSortFields.includes(sortBy as UserSortField)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sortBy field",
      });
    }
    if (typeof sortOrder !== "string" || !["asc", "desc"].includes(sortOrder)) {
      return res.status(400).json({
        success: false,
        message: "sortOrder must be asc or desc",
      });
    }
    const filters: UserListFilters = {
      page,
      limit,
      search: search || undefined,
      role: role as CompanyUserRole | undefined,
      status: status as CompanyUserStatus | undefined,
      sortBy: sortBy as UserSortField,
      sortOrder: sortOrder as UserSortOrder,
    };
    const result = await getCompanyUsers(companyId, filters);
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Failed to get company users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get users",
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

export const uploadMyProfileImage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select an image to upload",
            });
        }
        const user = await updateCurrentUserProfileImage(req.user.userId, req.file.buffer);
        return res.status(200).json({
            success: true,
            message: "Profile image uploaded successfully",
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

export const deleteMyProfileImage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const user = await removeCurrentUserProfileImage(req.user.userId);
        return res.status(200).json({
            success: true,
            message: "Profile image removed successfully",
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
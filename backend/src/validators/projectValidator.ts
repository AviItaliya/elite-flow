import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(150, "Project name must not exceed 150 characters"),
  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(150, "Project name must not exceed 150 characters")
    .optional(),
  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const updateProjectStatusSchema = z.object({
  status: z.enum([
    "PLANNING",
    "ACTIVE",
    "COMPLETED",
    "ON_HOLD",
    "CANCELLED",
  ]),
});
export type UpdateProjectStatusInput = z.infer<typeof updateProjectStatusSchema>;

export const projectMemberSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});
export type ProjectMemberInput = z.infer<typeof projectMemberSchema>;
import { z } from "zod";

export const createTaskSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  title: z
    .string()
    .min(2, "Task title must be at least 2 characters")
    .max(200, "Task title must not exceed 200 characters"),
  description: z
    .string()
    .max(2000, "Description must not exceed 2000 characters")
    .optional(),
  assignedTo: z
    .string()
    .uuid("Invalid assignee ID")
    .optional(),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .optional(),
  dueDate: z.coerce.date().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(2, "Task title must be at least 2 characters")
    .max(200, "Task title must not exceed 200 characters")
    .optional(),
  description: z
    .string()
    .max(2000, "Description must not exceed 2000 characters")
    .optional(),
  assignedTo: z
    .string()
    .uuid("Invalid assignee ID")
    .nullable()
    .optional(),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .optional(),
  dueDate: z.coerce.date().nullable().optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const updateTaskStatusSchema = z.object({
  status: z.enum([
    "TODO",
    "IN_PROGRESS",
    "REVIEW",
    "COMPLETED",
  ]),
});
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
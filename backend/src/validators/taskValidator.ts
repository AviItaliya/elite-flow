import { z } from "zod";

export const taskStatusValues = ["TODO", "IN_PROGRESS", "DONE", "TESTING", "QA_VERIFIED", "RE_OPEN", "DEPLOYMENT"] as const;
export const taskPriorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const createTaskSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  title: z
    .string()
    .trim()
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
  reportedTo: z
    .string()
    .uuid("Invalid reporting administrator ID")
    .optional(),
  priority: z.enum(taskPriorityValues).optional(),
  dueDate: z.coerce.date().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Task title must be at least 2 characters")
      .max(200, "Task title must not exceed 200 characters")
      .optional(),
    description: z
      .string()
      .max(2000, "Description must not exceed 2000 characters")
      .nullable()
      .optional(),
    assignedTo: z
      .string()
      .uuid("Invalid assignee ID")
      .nullable()
      .optional(),
    reportedTo: z
      .string()
      .uuid("Invalid reporting administrator ID")
      .nullable()
      .optional(),
    priority: z.enum(taskPriorityValues).optional(),
    dueDate: z.coerce.date().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for an update",
  });

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const updateTaskStatusSchema = z.object({status: z.enum(taskStatusValues)});

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;

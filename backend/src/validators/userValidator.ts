import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),

  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters"),

  role: z.enum(["ADMIN", "USER"]),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .optional(),

  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .optional(),

  role: z
    .enum(["ADMIN", "USER"])
    .optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
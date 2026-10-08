import { z } from "zod";

export const createPlanSchema = z.object({
  name: z
    .string()
    .min(2, "Plan name must be at least 2 characters")
    .max(100, "Plan name must not exceed 100 characters"),

  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),

  price: z
    .number()
    .min(0, "Price cannot be negative"),

  durationDays: z
    .number()
    .int()
    .positive("Duration must be greater than 0"),

  maxUsers: z
    .number()
    .int()
    .positive("Maximum users must be greater than 0"),

  maxProjects: z
    .number()
    .int()
    .positive("Maximum projects must be greater than 0"),
});

export const updatePlanSchema = createPlanSchema.partial();

export const updatePlanStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type UpdatePlanStatusInput = z.infer<typeof updatePlanStatusSchema>;
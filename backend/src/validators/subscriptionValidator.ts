import { z } from "zod";

export const createSubscriptionSchema = z.object({
  planId: z.string().uuid(),
});

export const changeSubscriptionPlanSchema = z.object({
  planId: z.string().uuid(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type ChangeSubscriptionPlanInput = z.infer<typeof changeSubscriptionPlanSchema>;
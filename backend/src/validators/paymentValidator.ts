import { z } from "zod";

export const createCheckoutSchema = z.object({
  planId: z.string().uuid("Invalid plan ID"),
});
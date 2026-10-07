import { z } from "zod";

export const updateCompanySchema = z.object({
  name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(150, "Company name must not exceed 150 characters")
    .optional(),

  email: z
    .string()
    .email("Please enter a valid company email")
    .toLowerCase()
    .optional(),

  phone: z
    .string()
    .max(20, "Phone number must not exceed 20 characters")
    .optional(),

  address: z
    .string()
    .max(300, "Address must not exceed 300 characters")
    .optional(),
});
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;


import { z } from "zod";

export const productQuerySchema = z.object({
  page: z.coerce.number().int("Page must be an integer.").min(1, "Page must be at least 1.").default(1),
  limit: z.coerce.number().int("Limit must be an integer.").min(1, "Limit must be at least 1.").max(100, "Limit cannot exceed 100.").default(10),
  search: z.string().trim().max(100, "Search is too long.").optional(),
  categoryId: z.string().trim().min(1).max(100).optional(),
  supplierId: z.string().trim().min(1).max(100).optional(),
  stockStatus: z.enum(["in-stock", "low-stock", "out-of-stock"]).optional(),
  sortBy: z.enum([
    "name",
    "sku",
    "price",
    "quantity",
    "minStock",
    "createdAt",
    "updatedAt",
  ]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;
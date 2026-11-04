import { z } from "zod";

const commentContentSchema = z.string().trim().min(1, "Comment cannot be empty").max(2000, "Comment must not exceed 2000 characters");

export const createCommentSchema = z.object({
  content: commentContentSchema,
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  content: commentContentSchema,
});

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
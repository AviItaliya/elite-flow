import type { Request } from "express";

export const getParamId = (req: Request): string => {
  const { id } = req.params;

  if (typeof id !== "string" || !id) {
    throw new Error("Invalid user ID");
  }

  return id;
};
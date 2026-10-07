import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export const getRequiredCompanyId = (
  req: AuthenticatedRequest
): string => {
  if (!req.user) {
    throw new Error("Authentication required");
  }

  if (!req.user.companyId) {
    throw new Error("User is not associated with a company");
  }

  return req.user.companyId;
};
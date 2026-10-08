import {createSuperadmin as createSuperadminRepository} from "../repositories/userRepository.js";
import { findUserByEmail } from "../repositories/authRepository.js";
import { hashPassword } from "../utils/password.js";
import type {CreateSuperadminInput} from "../validators/superadminValidator.js";

export const createSuperadmin = async (data: CreateSuperadminInput) => {
  const existingUser = await findUserByEmail(data.email);
  if (existingUser) {
    throw new Error("Email is already registered");
  }
  const hashedPassword = await hashPassword(data.password);
  const user = await createSuperadminRepository({
    name: data.name,
    email: data.email,
    password: hashedPassword,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    status: user.status,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
};
import {findUserById, findUserByIdAndCompany, findUsersByCompany, createUser as createUserRepository,  updateUser as updateUserRepository,
  updateUserStatus as updateUserStatusRepository, softDeleteUser, clearUserProfileImage, updateUserProfileImage} from "../repositories/userRepository.js";
import { hashPassword } from "../utils/password.js";
import type {CreateUserInput, UpdateUserInput, UpdateUserStatusInput} from "../validators/userValidator.js";
import {createEmailVerificationToken, findUserByEmail} from "../repositories/authRepository.js";
import { generateRandomToken } from "../utils/token.js";
import { sendEmail } from "./emailService.js";
import { verificationEmailTemplate } from "../templates/verificationEmail.js";
import { requireActiveSubscription } from "./subscriptionService.js";
import { countCompanyUsers } from "../repositories/subscriptionRepository.js";
import { deleteImage, uploadImage } from "./imageUploadService.js";

export const getCurrentUser = async (userId: string) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
    profileImageUrl: user.profileImageUrl,
    profileImagePublicId: user.profileImagePublicId,

    company: user.company
      ? {
          id: user.company.id,
          name: user.company.name,
          email: user.company.email,
          phone: user.company.phone,
          address: user.company.address,
          isActive: user.company.isActive,
        }
      : null,

    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const getCompanyUsers = async (companyId: string) => {
  const users = await findUsersByCompany(companyId);

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
    companyId: user.companyId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
};

export const getCompanyUserById = async (userId: string, companyId: string) => {
  const user = await findUserByIdAndCompany(userId, companyId);

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
    companyId: user.companyId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const createManagedUser = async (
  data: CreateUserInput,
  companyId: string,
  creatorRole: "ADMIN" | "SUPERADMIN",
) => {
  if (creatorRole === "ADMIN" && data.role === "ADMIN") {
    throw new Error("ADMIN cannot create another ADMIN");
  }

  const subscription = await requireActiveSubscription(companyId);
  const currentUserCount = await countCompanyUsers(companyId);
  if (currentUserCount >= subscription.plan.maxUsers) {
    throw new Error(
      `User limit reached for your current plan. Maximum users allowed: ${subscription.plan.maxUsers}`,
    );
  }

  const existingUser = await findUserByEmail(data.email);

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await createUserRepository({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: data.role,
    companyId,
  });

  const verificationToken = generateRandomToken();

  const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await createEmailVerificationToken(
    user.id,
    verificationToken,
    verificationExpiresAt,
  );

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  await sendEmail({
    to: user.email,
    subject: "Verify your EliteFlow account",
    html: verificationEmailTemplate(user.name, verificationUrl),
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
    companyId: user.companyId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const updateManagedUser = async (
  userId: string,
  companyId: string,
  data: UpdateUserInput,
  creatorRole: "ADMIN" | "SUPERADMIN",
) => {
  const existingUser = await findUserByIdAndCompany(userId, companyId);

  if (!existingUser) {
    throw new Error("User not found");
  }

  if (creatorRole === "ADMIN" && data.role === "ADMIN") {
    throw new Error("ADMIN cannot assign ADMIN role");
  }

  if (data.email && data.email !== existingUser.email) {
    const emailUser = await findUserByEmail(data.email);

    if (emailUser && emailUser.id !== userId) {
      throw new Error("A user with this email already exists");
    }
  }

  const emailChanged = !!data.email && data.email !== existingUser.email;

  const user = await updateUserRepository(userId, {
    ...data,
    ...(emailChanged ? { isVerified: false } : {}),
  });

  if (emailChanged) {
    const verificationToken = generateRandomToken();

    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await createEmailVerificationToken(
      user.id,
      verificationToken,
      verificationExpiresAt,
    );

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your new EliteFlow email",
      html: verificationEmailTemplate(user.name, verificationUrl),
    });
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
    companyId: user.companyId,
    updatedAt: user.updatedAt,
  };
};

export const changeUserStatus = async (
  userId: string,
  companyId: string,
  data: UpdateUserStatusInput,
  creatorUserId: string,
  creatorRole: "ADMIN" | "SUPERADMIN",
) => {
  const existingUser = await findUserByIdAndCompany(userId, companyId);
  if (!existingUser) {
    throw new Error("User not found");
  }
  if (existingUser.id === creatorUserId) {
    throw new Error("You cannot change your own account status");
  }
  if (creatorRole === "ADMIN" && existingUser.role === "ADMIN") {
    throw new Error("ADMINN cannot change another ADMIN's status");
  }
  if (existingUser.status === data.status) {
    throw new Error(`User is already ${data.status}`);
  }
  const user = await updateUserStatusRepository(userId, data.status);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
    companyId: user.companyId,
    updatedAt: user.updatedAt,
  };
};

export const deleteManagedUser = async (
  userId: string,
  companyId: string,
  creatorUserId: string,
  creatorRole: "ADMIN" | "SUPERADMIN",
) => {
  const existingUser = await findUserByIdAndCompany(userId, companyId);
  if (!existingUser) {
    throw new Error("User not found");
  }
  if (existingUser.id === creatorUserId) {
    throw new Error("You cannot delete your own account");
  }
  if (creatorRole === "ADMIN" && existingUser.role === "ADMIN") {
    throw new Error("ADMIN cannot delete another ADMIN");
  }
  const user = await softDeleteUser(userId);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    deletedAt: user.deletedAt,
  };
};

export const updateCurrentUserProfileImage = async (
  userId: string,
  buffer: Buffer,
) => {
  const existingUser = await findUserById(userId);

  if (!existingUser) {
    throw new Error("User not found");
  }

  const uploadedImage = await uploadImage(buffer, "eliteflow/profile-images");

  try {
    const updatedUser = await updateUserProfileImage(
      userId,
      uploadedImage.url,
      uploadedImage.publicId,
    );

    // Delete the previous image only after the database update succeeds.
    if (
      existingUser.profileImagePublicId &&
      existingUser.profileImagePublicId !== uploadedImage.publicId
    ) {
      try {
        await deleteImage(existingUser.profileImagePublicId);
      } catch (error) {
        // The new image is saved. Log cleanup failure for later retry.
        console.error("Failed to delete previous profile image:", error);
      }
    }

    return updatedUser;
  } catch (error) {
    // Avoid leaving the newly uploaded image behind if the database update fails.
    try {
      await deleteImage(uploadedImage.publicId);
    } catch (cleanupError) {
      console.error("Failed to clean up uploaded profile image:", cleanupError);
    }

    throw error;
  }
};

export const removeCurrentUserProfileImage = async (userId: string) => {
  const existingUser = await findUserById(userId);

  if (!existingUser) {
    throw new Error("User not found");
  }

  if (!existingUser.profileImagePublicId) {
    throw new Error("User does not have a profile image");
  }

  // Clear the database first so the profile no longer references the image.
  const updatedUser = await clearUserProfileImage(userId);

  try {
    await deleteImage(existingUser.profileImagePublicId);
  } catch (error) {
    // The database is already updated; log failed Cloudinary cleanup.
    console.error("Failed to delete profile image from Cloudinary:", error);
  }

  return updatedUser;
};

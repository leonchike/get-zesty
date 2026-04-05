"use server";

import prisma from "@/lib/prisma-client";
import { getUser, redirectToLogin } from "@/lib/actions/auth-actions";
import { getUserIdFromJwt } from "@/lib/helpers/get-user-id-from-jwt";
import { User } from "@prisma/client";
import bcrypt from "bcryptjs";

// Function to get current user

export async function getCurrentUserFromId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) return redirectToLogin();
  return user;
}

export async function getCurrentUserFromIdAPI(token: string) {
  try {
    const userId = getUserIdFromJwt(token);
    if (!userId) throw new Error("Unauthorized");
    return getCurrentUserFromId(userId);
  } catch (error) {
    console.error("Error getting current user:", error);
    throw new Error("Failed to get current user");
  }
}

// Function to edit user profile

export async function editUserProfile(userId: string, data: User) {
  const { id, email, password, ...safeData } = data;

  return prisma.user.update({
    where: { id: userId },
    data: safeData,
  });
}

export async function editUserProfileAction(data: User) {
  const user = await getUser();
  if (!user) return redirectToLogin();
  const userId = user.id;
  if (!userId) return redirectToLogin();
  return editUserProfile(userId, data);
}

export async function editUserProfileAPI(token: string, data: User) {
  try {
    const userId = getUserIdFromJwt(token);
    if (!userId) throw new Error("Unauthorized");
    return editUserProfile(userId, data);
  } catch (error) {
    console.error("Error editing user profile:", error);
    throw new Error("Failed to edit user profile");
  }
}

// End function to edit user profile

// Function to deactivate user account

export async function deactivateUserAccount(userId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) return { success: false, error: "User not found" };

  const isPasswordValid = await bcrypt.compare(
    password,
    user.password as string
  );
  if (!isPasswordValid) return { success: false, error: "Invalid password" };

  await prisma.user.update({
    where: { id: userId },
    data: { isAccountDisabled: true },
  });

  return { success: true, message: "User account deactivated successfully" };
}

export async function deactivateUserAccountAction(
  userId: string,
  password: string
) {
  const user = await getUser();
  if (!user) return redirectToLogin();
  return deactivateUserAccount(userId, password);
}

export async function deactivateUserAccountAPI(
  token: string,
  data: { password: string }
) {
  try {
    const userId = getUserIdFromJwt(token);
    if (!userId) throw new Error("Unauthorized");
    return deactivateUserAccount(userId, data.password);
  } catch (error) {
    console.error("Error deactivating user account:", error);
    throw new Error("Failed to deactivate user account");
  }
}

// End function to deactivate user account

// Function to update user password

export async function updateUserPassword(
  userId: string,
  oldPassword: string,
  newPassword: string
) {
  if (!userId) return { error: "User not found" };
  if (!oldPassword) return { error: "Old password is required" };
  if (!newPassword) return { error: "New password is required" };

  console.log(oldPassword, newPassword);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) return { success: false, error: "User not found" };

  const isPasswordValid = await bcrypt.compare(
    oldPassword,
    user.password as string
  );
  if (!isPasswordValid)
    return {
      success: false,
      error: "Invalid old password",
    };
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  console.log(hashedPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { success: true, message: "Password updated successfully" };
}

export async function updateUserPasswordAction(
  oldPassword: string,
  newPassword: string
) {
  const user = await getUser();
  if (!user) return redirectToLogin();
  const userId = user.id;
  if (!userId) return redirectToLogin();
  return updateUserPassword(userId, oldPassword, newPassword);
}

export async function updateUserPasswordAPI(
  token: string,
  data: { oldPassword: string; newPassword: string }
) {
  try {
    const userId = getUserIdFromJwt(token);
    if (!userId) throw new Error("Unauthorized");
    return updateUserPassword(
      userId,
      data.oldPassword as string,
      data.newPassword as string
    );
  } catch (error) {
    console.error("Error updating user password:", error);
    throw new Error("Failed to update user password");
  }
}

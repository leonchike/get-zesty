"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma-client";
import { getUser } from "@/lib/actions/auth-actions";
import type {
  CreateHouseholdMemberInput,
  UpdateHouseholdMemberInput,
} from "@/features/home-tasks/types";

function isDuplicateNameError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function revalidateMemberPaths() {
  revalidatePath("/home-tasks");
  revalidatePath("/settings");
}

export async function getHouseholdMembersBase(userId: string) {
  try {
    return prisma.householdMember.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.error("Error getting household members:", error);
    throw new Error("Failed to get household members");
  }
}

export async function getHouseholdMembersAction() {
  const user = await getUser();
  if (!user?.id) return [];
  return getHouseholdMembersBase(user.id);
}

export async function createHouseholdMemberBase(
  input: CreateHouseholdMemberInput,
  userId: string
) {
  if (!userId) throw new Error("User ID is required");
  if (!input.name?.trim()) throw new Error("Member name is required");
  if (!input.color?.trim()) throw new Error("Member color is required");

  try {
    return await prisma.householdMember.create({
      data: {
        name: input.name.trim(),
        color: input.color,
        userId,
      },
    });
  } catch (error) {
    if (isDuplicateNameError(error)) {
      throw new Error(`A member named "${input.name.trim()}" already exists`);
    }
    console.error("Error creating household member:", error);
    throw new Error("Failed to create household member");
  }
}

export async function createHouseholdMemberAction(
  input: CreateHouseholdMemberInput
) {
  const user = await getUser();
  if (!user?.id) throw new Error("Not authenticated");
  const member = await createHouseholdMemberBase(input, user.id);
  revalidateMemberPaths();
  return member;
}

export async function updateHouseholdMemberBase(
  id: string,
  input: UpdateHouseholdMemberInput,
  userId: string
) {
  if (!userId) throw new Error("User ID is required");

  try {
    const existing = await prisma.householdMember.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error("Member not found");

    if (input.name !== undefined && !input.name.trim()) {
      throw new Error("Member name is required");
    }

    return await prisma.householdMember.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.color !== undefined && { color: input.color }),
      },
    });
  } catch (error) {
    if (isDuplicateNameError(error)) {
      throw new Error(`A member named "${input.name?.trim()}" already exists`);
    }
    console.error("Error updating household member:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to update household member");
  }
}

export async function updateHouseholdMemberAction(
  id: string,
  input: UpdateHouseholdMemberInput
) {
  const user = await getUser();
  if (!user?.id) throw new Error("Not authenticated");
  const member = await updateHouseholdMemberBase(id, input, user.id);
  revalidateMemberPaths();
  return member;
}

export async function deleteHouseholdMemberBase(id: string, userId: string) {
  if (!userId) throw new Error("User ID is required");

  try {
    const existing = await prisma.householdMember.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error("Member not found");

    // Tasks assigned to this member are auto-unassigned via onDelete: SetNull
    await prisma.householdMember.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting household member:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to delete household member");
  }
}

export async function deleteHouseholdMemberAction(id: string) {
  const user = await getUser();
  if (!user?.id) throw new Error("Not authenticated");
  const result = await deleteHouseholdMemberBase(id, user.id);
  revalidateMemberPaths();
  return result;
}

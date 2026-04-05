"use server";

import prisma from "@/lib/prisma-client";
import { getUser } from "@/lib/actions/auth-actions";
import { getUserIdFromJwt } from "@/lib/helpers/get-user-id-from-jwt";

export async function getRecipeById(id: string, userId: string | null) {
  try {
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: id,
        isDeleted: false,
        OR: [{ isPublic: true }, { userId: userId ?? "" }],
      },
    });

    if (!recipe) {
      throw new Error("Recipe not found or not accessible");
    }

    return recipe;
  } catch (error) {
    console.error("Error getting recipe:", error);
    return null;
  }
}

export async function getRecipeByIdAction(id: string) {
  const user = await getUser();
  const userId = user?.id ?? null;
  return getRecipeById(id, userId);
}

export async function getRecipeByIdAPI(token: string, id: string) {
  try {
    const userId = getUserIdFromJwt(token);
    return getRecipeById(id, userId);
  } catch (error) {
    console.error("Error getting recipe:", error);
    return null;
  }
}

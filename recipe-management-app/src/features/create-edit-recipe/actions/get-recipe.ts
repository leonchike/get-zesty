"use server";

import prisma from "@/lib/prisma-client";
import { getUser } from "@/lib/actions/auth-actions";

export async function getRecipeById(id: string) {
  try {
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: id,
        isDeleted: false,
        OR: [{ isPublic: true }, { userId: (await getUser())?.id ?? "" }],
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

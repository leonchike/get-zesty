import prisma from "@/lib/prisma-client";

/**
 * Resolves a recipe id to the correct foreign key. Grocery and inventory items
 * can be linked to either a personal recipe (Recipe) or a cookbook recipe
 * (CookbookRecipe) — separate tables — so a single id must be routed to the
 * matching column. An id that matches neither yields a null/null pair, leaving
 * the item unlinked rather than triggering a foreign-key violation.
 */
export async function resolveRecipeLink(
  recipeId: string | null | undefined,
  userId: string
): Promise<{ recipeId: string | null; cookbookRecipeId: string | null }> {
  if (!recipeId) return { recipeId: null, cookbookRecipeId: null };

  const personal = await prisma.recipe.findFirst({
    where: { id: recipeId, isDeleted: false, OR: [{ userId }, { isPublic: true }] },
    select: { id: true },
  });
  if (personal) return { recipeId, cookbookRecipeId: null };

  const cookbook = await prisma.cookbookRecipe.findFirst({
    where: { id: recipeId, userId },
    select: { id: true },
  });
  if (cookbook) return { recipeId: null, cookbookRecipeId: recipeId };

  return { recipeId: null, cookbookRecipeId: null };
}

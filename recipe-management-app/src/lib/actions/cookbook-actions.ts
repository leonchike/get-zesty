/**
 * Cookbook business logic — called by MCP API routes
 */

import prisma from "@/lib/prisma-client";
import { searchCookbookRecipesHybrid } from "@/lib/search/hybrid-search";
import { isQueryActionable } from "@/lib/search/query";

/**
 * List all cookbooks for a user
 */
export async function listCookbooks(
  userId: string,
  options?: { sort?: string; search?: string }
) {
  const sort = options?.sort ?? "title-asc";
  const search = options?.search?.trim() ?? "";

  let orderBy: Record<string, "asc" | "desc">;
  switch (sort) {
    case "title-desc":
      orderBy = { title: "desc" };
      break;
    case "updatedAt-desc":
      orderBy = { updatedAt: "desc" };
      break;
    case "createdAt-desc":
      orderBy = { createdAt: "desc" };
      break;
    case "recipeCount-desc":
      orderBy = { recipeCount: "desc" };
      break;
    case "title-asc":
    default:
      orderBy = { title: "asc" };
      break;
  }

  const where: any = { userId };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.cookbook.findMany({
    where,
    orderBy,
    select: {
      id: true,
      title: true,
      author: true,
      publisher: true,
      year: true,
      description: true,
      coverUrl: true,
      recipeCount: true,
    },
  });
}

/**
 * Get a specific cookbook recipe by ID
 */
export async function getCookbookRecipe(recipeId: string, userId: string) {
  return prisma.cookbookRecipe.findFirst({
    where: { id: recipeId, userId },
    include: {
      cookbook: {
        select: { title: true, author: true },
      },
    },
  });
}

/**
 * Cookbook recipe search — hybrid (FTS + trigram + vector) with RRF fusion.
 * Exposed via /api/mcp/cookbooks/search. Preserves the pre-existing response
 * shape ({ results: [{ recipe, score, matchType }], totalCount }) so downstream
 * MCP clients don't break.
 */
export async function searchCookbookRecipes(
  userId: string,
  query: string,
  options?: {
    cookbookId?: string;
    cuisineType?: string;
    mealType?: string;
    limit?: number;
  }
) {
  if (!isQueryActionable(query)) {
    return { results: [], totalCount: 0 };
  }

  const hybrid = await searchCookbookRecipesHybrid(userId, query, {
    limit: options?.limit ?? 10,
    filters: {
      cookbookId: options?.cookbookId,
      cuisineType: options?.cuisineType,
      mealType: options?.mealType,
    },
  });

  // Hydrate the extra fields the MCP response shape promises but hybrid-search
  // doesn't return (ingredients, instructions, pageNumber, servings, prepTime,
  // cookTime, mealType). One query for the lot.
  const ids = hybrid.map((h) => h.id);
  const extras = ids.length
    ? await prisma.cookbookRecipe.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          ingredients: true,
          instructions: true,
          pageNumber: true,
          mealType: true,
          servings: true,
          prepTime: true,
          cookTime: true,
        },
      })
    : [];
  const byId = new Map(extras.map((e) => [e.id, e]));

  return {
    results: hybrid.map((h) => {
      const extra = byId.get(h.id);
      return {
        recipe: {
          id: h.id,
          cookbookId: h.cookbookId,
          title: h.title,
          description: h.description,
          ingredients: extra?.ingredients ?? null,
          instructions: extra?.instructions ?? null,
          pageNumber: extra?.pageNumber ?? null,
          cuisineType: h.cuisineType,
          mealType: extra?.mealType ?? null,
          servings: extra?.servings ?? null,
          prepTime: extra?.prepTime ?? null,
          cookTime: extra?.cookTime ?? null,
          cookbook: { title: h.cookbookTitle, author: h.cookbookAuthor },
        },
        score: h.finalScore,
        // RRF doesn't separate arms, so we label everything hybrid. Downstream
        // callers that branched on matchType will just see "hybrid" going forward.
        matchType: "hybrid" as const,
      };
    }),
    totalCount: hybrid.length,
  };
}

/**
 * Delete all cookbook data for a user (or a specific cookbook).
 * Cascades: Cookbook → CookbookRecipe → RecipeChunk (including embeddings).
 */
export async function clearCookbookData(
  userId: string,
  cookbookId?: string
): Promise<{ deletedCookbooks: number; deletedRecipes: number; deletedChunks: number }> {
  const where = cookbookId
    ? { id: cookbookId, userId }
    : { userId };

  // Count what we're about to delete
  const cookbooks = await prisma.cookbook.findMany({
    where,
    select: { id: true },
  });
  const cookbookIds = cookbooks.map((c) => c.id);

  if (cookbookIds.length === 0) {
    return { deletedCookbooks: 0, deletedRecipes: 0, deletedChunks: 0 };
  }

  // Count recipes and chunks before deleting
  const recipeCount = await prisma.cookbookRecipe.count({
    where: { cookbookId: { in: cookbookIds } },
  });

  const chunkCount = await prisma.recipeChunk.count({
    where: {
      cookbookRecipe: { cookbookId: { in: cookbookIds } },
    },
  });

  // Delete cookbooks (cascades to recipes and chunks)
  await prisma.cookbook.deleteMany({ where });

  return {
    deletedCookbooks: cookbookIds.length,
    deletedRecipes: recipeCount,
    deletedChunks: chunkCount,
  };
}

/**
 * Quick cookbook search — hybrid (FTS + trigram + vector) with RRF fusion.
 * Keeps the same return shape as before so existing callers don't need to change.
 */
export async function quickSearchCookbookRecipes(
  userId: string,
  query: string,
  limit: number = 5
) {
  if (!isQueryActionable(query)) {
    return { recipes: [], totalCount: 0 };
  }

  const hybrid = await searchCookbookRecipesHybrid(userId, query, { limit });

  const recipes = hybrid.map((h) => ({
    id: h.id,
    title: h.title,
    description: h.description,
    cookbookId: h.cookbookId,
    cuisineType: h.cuisineType,
    imageUrl: h.imageUrl,
    titleHighlight: h.titleHighlight,
    cookbook: {
      title: h.cookbookTitle,
      author: h.cookbookAuthor,
      coverUrl: h.cookbookCoverUrl,
    },
  }));

  return { recipes, totalCount: recipes.length };
}

/**
 * List all recipes in a cookbook with pagination
 */
export async function listCookbookRecipes(
  userId: string,
  cookbookId: string,
  options?: { page?: number; limit?: number }
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;
  const offset = (page - 1) * limit;

  const where = { cookbookId, userId };

  const [recipes, totalCount] = await prisma.$transaction([
    prisma.cookbookRecipe.findMany({
      where,
      orderBy: { pageNumber: "asc" },
      skip: offset,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        pageNumber: true,
        cuisineType: true,
        mealType: true,
        cookbookId: true,
        cookbook: {
          select: { title: true, author: true },
        },
      },
    }),
    prisma.cookbookRecipe.count({ where }),
  ]);

  const nextPage = offset + limit < totalCount ? page + 1 : null;

  return { recipes, totalCount, nextPage };
}

/**
 * Search cookbook recipes by ingredient list
 */
export async function searchByIngredient(
  userId: string,
  ingredients: string[],
  matchAll: boolean = false
) {
  // Build ingredient search as full-text query
  const joiner = matchAll ? " & " : " | ";
  const tsQuery = ingredients.map((i) => i.trim().toLowerCase()).join(joiner);

  const results = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      title: string;
      description: string | null;
      ingredients: string | null;
      pageNumber: number | null;
      cuisineType: string | null;
      mealType: string | null;
      cookbookId: string;
      cookbookTitle: string;
      cookbookAuthor: string | null;
      rank: number;
    }>
  >(
    `
    SELECT
      cr.id,
      cr.title,
      cr.description,
      cr.ingredients,
      cr."pageNumber",
      cr."cuisineType",
      cr."mealType",
      cr."cookbookId",
      cb.title AS "cookbookTitle",
      cb.author AS "cookbookAuthor",
      ts_rank(
        to_tsvector('english', coalesce(cr.ingredients, '')),
        to_tsquery('english', $2)
      ) AS rank
    FROM "CookbookRecipe" cr
    JOIN "Cookbook" cb ON cb.id = cr."cookbookId"
    WHERE cr."userId" = $1
      AND to_tsvector('english', coalesce(cr.ingredients, ''))
          @@ to_tsquery('english', $2)
    ORDER BY rank DESC
    LIMIT 20
    `,
    userId,
    tsQuery
  );

  const maxRank = results.length > 0 ? Math.max(...results.map((r) => r.rank)) : 1;

  return {
    results: results.map((r) => ({
      recipe: {
        id: r.id,
        cookbookId: r.cookbookId,
        title: r.title,
        description: r.description,
        ingredients: r.ingredients,
        pageNumber: r.pageNumber,
        cuisineType: r.cuisineType,
        mealType: r.mealType,
        cookbook: { title: r.cookbookTitle, author: r.cookbookAuthor },
      },
      score: maxRank > 0 ? r.rank / maxRank : 0,
      matchType: "fulltext" as const,
    })),
    totalCount: results.length,
  };
}

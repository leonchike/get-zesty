// app/actions/fetchRecipes-actions.ts

"use server";

import prisma from "@/lib/prisma-client";
import { Recipe, Prisma } from "@prisma/client";
import { getUser, redirectToLogin } from "@/lib/actions/auth-actions";
import { getUserIdFromJwt } from "@/lib/helpers/get-user-id-from-jwt";
import { searchRecipes as hybridSearchRecipes } from "@/lib/search/hybrid-search";
import { isQueryActionable } from "@/lib/search/query";

export interface FetchRecipesParams {
  token?: string;
  search?: string;
  isFavorite?: boolean;
  isPinned?: boolean;
  isPersonal?: boolean;
  isPublic?: boolean;
  cuisineTypes?: string[];
  mealTypes?: string[];
  page?: number;
  limit?: number;
}

export interface FetchRecipesResult {
  recipes: Array<Recipe & { titleHighlight?: string }>;
  nextPage: number | null;
  totalCount: number;
}

export async function fetchRecipes(
  userId: string | null,
  {
    search,
    isFavorite,
    isPinned,
    isPersonal,
    isPublic,
    cuisineTypes,
    mealTypes,
    page = 1,
    limit = 64,
  }: FetchRecipesParams
): Promise<FetchRecipesResult> {
  const startTime = Date.now();

  // Filter out empty strings
  const filteredMealTypes =
    mealTypes?.filter((type) => type.trim() !== "") || [];
  const filteredCuisineTypes =
    cuisineTypes?.filter((type) => type.trim() !== "") || [];

  try {
    const offset = (page - 1) * limit;

    // We'll build up a list of AND conditions
    // so that each filter adds more constraints.
    const andConditions: Prisma.RecipeWhereInput[] = [{ isDeleted: false }];

    if (!userId) {
      // Unauthenticated: only public recipes
      andConditions.push({ isPublic: true });
    } else {
      // Authenticated: either user-owned OR public
      andConditions.push({
        OR: [
          { userId }, // My recipes
          { isPublic: true }, // Public recipes
        ],
      });
    }

    // If the user wants ONLY their own recipes:
    if (isPersonal && userId) {
      andConditions.push({ userId });
    }

    // If the user wants ONLY public recipes:
    if (isPublic) {
      andConditions.push({ isPublic: true });
    }

    // If user wants only favorites:
    if (isFavorite && userId) {
      andConditions.push({ FavoriteRecipe: { some: { userId } } });
    }

    // If user wants only pinned:
    if (isPinned && userId) {
      andConditions.push({ PinnedRecipe: { some: { userId } } });
    }

    // Cuisine filter
    if (filteredCuisineTypes.length > 0) {
      andConditions.push({ cuisineType: { in: filteredCuisineTypes } });
    }

    // Meal type filter
    if (filteredMealTypes.length > 0) {
      andConditions.push({ mealType: { in: filteredMealTypes } });
    }

    // ─── Search mode: delegate to hybrid search (FTS + trigram + vector + RRF) ───
    if (search && isQueryActionable(search)) {
      const topN = offset + limit; // fetch enough to slice the current page
      const hybrid = await hybridSearchRecipes(userId, search, {
        limit: topN,
        filters: {
          cuisineTypes: filteredCuisineTypes,
          mealTypes: filteredMealTypes,
          isFavorite: isFavorite ?? undefined,
          isPinned: isPinned ?? undefined,
          includePublic: isPersonal ? false : true,
        },
      });

      if (hybrid.length === 0) {
        return { recipes: [], nextPage: null, totalCount: 0 };
      }

      // Hydrate full Recipe rows (with includes) and preserve hybrid order.
      const orderedIds = hybrid.map((h) => h.id);
      const byId: Record<string, (typeof hybrid)[number]> = Object.fromEntries(
        hybrid.map((h) => [h.id, h])
      );
      const fullRecipes = await prisma.recipe.findMany({
        where: { id: { in: orderedIds }, isDeleted: false },
        include: { FavoriteRecipe: true, PinnedRecipe: true },
      });
      const recipeById: Record<string, (typeof fullRecipes)[number]> =
        Object.fromEntries(fullRecipes.map((r) => [r.id, r]));

      const sliced = orderedIds.slice(offset, offset + limit);
      const recipes = sliced
        .map((id) => {
          const r = recipeById[id];
          if (!r) return null;
          return { ...r, titleHighlight: byId[id]?.titleHighlight };
        })
        .filter(Boolean) as Array<Recipe & { titleHighlight?: string }>;

      const totalCount = hybrid.length;
      const nextPage = offset + limit < totalCount ? page + 1 : null;
      return { recipes, nextPage, totalCount };
    }

    // ─── No search term: use the existing Prisma path (filters + pagination) ───
    const whereClause: Prisma.RecipeWhereInput = { AND: andConditions };

    const [fetchedRecipes, totalCount] = await prisma.$transaction([
      prisma.recipe.findMany({
        where: whereClause,
        orderBy: { updatedAt: "desc" },
        skip: offset,
        take: limit,
        include: { FavoriteRecipe: true, PinnedRecipe: true },
      }),
      prisma.recipe.count({ where: whereClause }),
    ]);

    const nextPage = offset + limit < totalCount ? page + 1 : null;
    return { recipes: fetchedRecipes, nextPage, totalCount };
  } catch (error) {
    console.error("Error fetching recipes:", error);
    throw new Error("Failed to fetch recipes");
  }
}

export async function fetchRecipesAction(params: FetchRecipesParams) {
  const user = await getUser();
  const userId = user?.id ?? null;
  return fetchRecipes(userId, params);
}

export async function fetchRecipesAPI(
  token: string | null,
  params: FetchRecipesParams
) {
  try {
    const userId = token ? getUserIdFromJwt(token) : null;
    return fetchRecipes(userId, params);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    throw new Error("Failed to fetch recipes");
  }
}

export interface FetchFilterOptionsParams {
  token?: string;
  isFavorite?: boolean;
  isPinned?: boolean;
  isPersonal?: boolean;
  isPublic?: boolean;
  cuisineType?: string[];
  mealType?: string[];
}

export async function fetchFilterOptions(
  userId: string | null,
  params: FetchFilterOptionsParams
): Promise<{ mealTypes: string[]; cuisineTypes: string[] }> {
  try {
    const andConditions: Prisma.RecipeWhereInput[] = [{ isDeleted: false }];

    if (!userId) {
      // Unauthenticated: only public recipes
      andConditions.push({ isPublic: true });
    } else {
      // Authenticated: either user-owned OR public
      andConditions.push({
        OR: [
          { userId }, // My recipes
          { isPublic: true }, // Public recipes
        ],
      });
    }

    if (params.isPersonal && userId) {
      andConditions.push({ userId });
    }

    if (params.isPublic) {
      andConditions.push({ isPublic: true });
    }

    if (params.isFavorite && userId) {
      andConditions.push({ FavoriteRecipe: { some: { userId } } });
    }

    if (params.isPinned && userId) {
      andConditions.push({ PinnedRecipe: { some: { userId } } });
    }

    const whereClause: Prisma.RecipeWhereInput = {
      AND: andConditions,
    };

    const [mealTypes, cuisineTypes] = await prisma.$transaction([
      prisma.recipe.findMany({
        where: { ...whereClause, mealType: { not: null } },
        select: { mealType: true },
        distinct: ["mealType"],
      }),
      prisma.recipe.findMany({
        where: { ...whereClause, cuisineType: { not: null } },
        select: { cuisineType: true },
        distinct: ["cuisineType"],
      }),
    ]);

    return {
      mealTypes: mealTypes.map((mt) => mt.mealType!).filter(Boolean),
      cuisineTypes: cuisineTypes.map((ct) => ct.cuisineType!).filter(Boolean),
    };
  } catch (error) {
    console.error("Error fetching filter options:", error);
    throw new Error("Failed to fetch filter options");
  }
}

export async function fetchFilterOptionsAction(
  params: FetchFilterOptionsParams
) {
  const user = await getUser();
  const userId = user?.id ?? null;
  return fetchFilterOptions(userId, params);
}

export async function fetchFilterOptionsAPI(
  token: string,
  params: FetchFilterOptionsParams
) {
  try {
    const userId = token ? getUserIdFromJwt(token) : null;

    return fetchFilterOptions(userId, params);
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return { pinned: false };
  }
}

"use server";

import prisma from "@/lib/prisma-client";
import { getUser } from "@/lib/actions/auth-actions";
import { clearCookbookData } from "@/lib/actions/cookbook-actions";
import type {
  CookbookSortField,
  FetchCookbooksParams,
} from "../types/cookbook-sort";

function buildCookbookOrderBy(sort: CookbookSortField) {
  switch (sort) {
    case "title-desc":
      return { title: "desc" as const };
    case "updatedAt-desc":
      return { updatedAt: "desc" as const };
    case "createdAt-desc":
      return { createdAt: "desc" as const };
    case "recipeCount-desc":
      return { recipeCount: "desc" as const };
    case "title-asc":
    default:
      return { title: "asc" as const };
  }
}

export async function fetchCookbooksAction(params?: FetchCookbooksParams) {
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const sort = params?.sort ?? "title-asc";
  const search = params?.search?.trim() ?? "";

  const where: any = { userId: user.id };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
    ];
  }

  const cookbooks = await prisma.cookbook.findMany({
    where,
    orderBy: buildCookbookOrderBy(sort),
    select: {
      id: true,
      title: true,
      author: true,
      publisher: true,
      year: true,
      description: true,
      recipeCount: true,
      totalPages: true,
      coverUrl: true,
      createdAt: true,
    },
  });

  return cookbooks;
}

export async function fetchCookbookDetailAction(cookbookId: string) {
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const cookbook = await prisma.cookbook.findFirst({
    where: { id: cookbookId, userId: user.id },
    select: {
      id: true,
      title: true,
      author: true,
      publisher: true,
      year: true,
      description: true,
      recipeCount: true,
      totalPages: true,
      coverUrl: true,
    },
  });

  return cookbook;
}

export interface FetchCookbookRecipesParams {
  cookbookId: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function fetchCookbookRecipesAction(
  params: FetchCookbookRecipesParams
) {
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const { cookbookId, search, page = 1, limit = 50 } = params;
  const offset = (page - 1) * limit;

  const where: any = {
    cookbookId,
    userId: user.id,
  };

  if (search?.trim()) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { ingredients: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

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
      },
    }),
    prisma.cookbookRecipe.count({ where }),
  ]);

  const nextPage = offset + limit < totalCount ? page + 1 : null;

  return { recipes, totalCount, nextPage };
}

export async function fetchCookbookRecipeAction(recipeId: string) {
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const recipe = await prisma.cookbookRecipe.findFirst({
    where: { id: recipeId, userId: user.id },
    include: {
      cookbook: {
        select: { id: true, title: true, author: true },
      },
    },
  });

  return recipe;
}

export async function deleteCookbookAction(cookbookId: string) {
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  return clearCookbookData(user.id, cookbookId);
}

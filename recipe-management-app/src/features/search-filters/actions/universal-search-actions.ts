"use server";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { fetchRecipes } from "./search-actions";
import { quickSearchCookbookRecipes } from "@/lib/actions/cookbook-actions";

export interface UniversalSearchResult {
  id: string;
  type: "recipe" | "cookbook-recipe";
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  href: string;
}

export async function universalSearchAction(query: string): Promise<{
  recipes: UniversalSearchResult[];
  cookbookRecipes: UniversalSearchResult[];
}> {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { recipes: [], cookbookRecipes: [] };
  }

  // Fetch both in parallel
  const [recipeData, cookbookData] = await Promise.all([
    fetchRecipes(userId, {
      search: trimmed,
      page: 1,
      limit: 6,
    }),
    userId
      ? quickSearchCookbookRecipes(userId, trimmed, 5)
      : Promise.resolve({ recipes: [], totalCount: 0 }),
  ]);

  const recipes: UniversalSearchResult[] = recipeData.recipes.map((r) => ({
    id: r.id,
    type: "recipe" as const,
    title: r.title,
    subtitle: r.cuisineType || r.mealType || null,
    imageUrl: r.imageUrl || null,
    href: `/recipes/${r.id}`,
  }));

  const cookbookRecipes: UniversalSearchResult[] = cookbookData.recipes.map(
    (r: any) => ({
      id: r.id,
      type: "cookbook-recipe" as const,
      title: r.title,
      subtitle: r.cookbook?.title || r.cuisineType || null,
      imageUrl: r.cookbook?.coverUrl || r.imageUrl || null,
      href: `/cookbooks/${r.cookbookId}/recipes/${r.id}`,
    })
  );

  return { recipes, cookbookRecipes };
}

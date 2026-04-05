import { getUserIdFromJwt } from "@/lib/helpers/get-user-id-from-jwt";
import {
  listCookbookRecipes,
  getCookbookRecipe,
} from "@/lib/actions/cookbook-actions";
import { NextRequest, NextResponse } from "next/server";

// GET — list recipes in a cookbook, or get a single recipe by ID
export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = getUserIdFromJwt(token);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const recipeId = searchParams.get("recipe_id");
    const cookbookId = searchParams.get("cookbook_id");

    // Single recipe fetch
    if (recipeId) {
      const recipe = await getCookbookRecipe(recipeId, userId);
      if (!recipe) {
        return NextResponse.json(
          { error: "Recipe not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(recipe);
    }

    // List recipes in a cookbook
    if (!cookbookId) {
      return NextResponse.json(
        { error: "cookbook_id is required" },
        { status: 400 }
      );
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = await listCookbookRecipes(userId, cookbookId, {
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch cookbook recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch cookbook recipes" },
      { status: 500 }
    );
  }
}

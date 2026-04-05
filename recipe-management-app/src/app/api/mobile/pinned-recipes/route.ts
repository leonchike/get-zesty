import {
  getPinnedRecipesAPI,
  togglePinRecipeAPI,
} from "@/lib/actions/recipe-actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pinnedRecipes = await getPinnedRecipesAPI(token);
    return NextResponse.json(pinnedRecipes);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get pinned recipes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recipeId } = await req.json();

  try {
    const pinnedRecipe = await togglePinRecipeAPI(token, recipeId);
    return NextResponse.json(pinnedRecipe);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to toggle pin recipe" },
      { status: 500 }
    );
  }
}

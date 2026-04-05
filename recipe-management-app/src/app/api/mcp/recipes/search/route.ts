import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import {
  fetchRecipes,
  FetchRecipesParams,
} from "@/features/search-filters/actions/search-actions";

// Search recipes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const auth = await verifyMCPAuth(req, body);

    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const { filters } = body;

    const params: FetchRecipesParams = {
      search: filters?.search,
      isFavorite: filters?.isFavorite,
      isPinned: filters?.isPinned,
      isPersonal: filters?.isPersonal,
      isPublic: filters?.isPublic,
      cuisineTypes: filters?.cuisineTypes,
      mealTypes: filters?.mealTypes,
      page: filters?.page || 1,
      limit: filters?.limit || 64,
    };

    const result = await fetchRecipes(auth.userId!, params);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error searching recipes:", error);
    return NextResponse.json(
      { error: "Failed to search recipes" },
      { status: 500 }
    );
  }
}

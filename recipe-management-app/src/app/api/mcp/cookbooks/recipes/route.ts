/**
 * GET /api/mcp/cookbooks/recipes — Get specific cookbook recipe by ID
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import { getCookbookRecipe } from "@/lib/actions/cookbook-actions";

export async function GET(req: NextRequest) {
  try {
    const recipeId = req.nextUrl.searchParams.get("id");
    const userId = req.nextUrl.searchParams.get("user_id") || "";

    if (!recipeId) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
        { status: 400 }
      );
    }

    const auth = await verifyMCPAuth(req, { user_id: userId });
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const recipe = await getCookbookRecipe(recipeId, auth.userId!);
    if (!recipe) {
      return NextResponse.json(
        { error: "Cookbook recipe not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Error fetching cookbook recipe:", error);
    return NextResponse.json(
      { error: "Failed to fetch cookbook recipe" },
      { status: 500 }
    );
  }
}

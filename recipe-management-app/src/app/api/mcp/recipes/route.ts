import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import { getRecipeById } from "@/features/recipe-view/actions/get-recipe";
import {
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from "@/lib/actions/recipe-actions";
import { Recipe } from "@prisma/client";

// Get recipe by id
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
        { status: 400 }
      );
    }

    // For GET, we need to parse searchParams for user_id
    const user_id = req.nextUrl.searchParams.get("user_id");
    const auth = await verifyMCPAuth(req, { user_id: user_id || undefined });

    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const recipe = await getRecipeById(id, auth.userId!);

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipe" },
      { status: 500 }
    );
  }
}

// Create recipe
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

    const { recipe, parseWithAI } = body;

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe data is required" },
        { status: 400 }
      );
    }

    const result = await createRecipe(
      recipe as Omit<Recipe, "id" | "userId" | "createdAt" | "updatedAt">,
      auth.userId!,
      parseWithAI ?? true
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating recipe:", error);
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 }
    );
  }
}

// Update recipe
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const auth = await verifyMCPAuth(req, body);

    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const { id, recipe, parseWithAI } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
        { status: 400 }
      );
    }

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe data is required" },
        { status: 400 }
      );
    }

    const result = await updateRecipe(
      auth.userId!,
      id,
      recipe as Partial<
        Omit<Recipe, "id" | "userId" | "createdAt" | "updatedAt">
      >,
      parseWithAI ?? true
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating recipe:", error);
    return NextResponse.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }
}

// Delete recipe (soft delete)
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const auth = await verifyMCPAuth(req, body);

    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteRecipe(auth.userId!, id);

    return NextResponse.json({ id: result });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return NextResponse.json(
      { error: "Failed to delete recipe" },
      { status: 500 }
    );
  }
}

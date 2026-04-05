import { getRecipeByIdAPI } from "@/features/recipe-view/actions/get-recipe";
import { NextRequest, NextResponse } from "next/server";
import {
  createRecipeAPI,
  updateRecipeAPI,
  deleteRecipeAPI,
} from "@/lib/actions/recipe-actions";

// Get recipe by id
export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Recipe ID is required" },
      { status: 400 }
    );
  }

  try {
    const recipe = await getRecipeByIdAPI(token, id);
    console.log("recipe", recipe);
    return NextResponse.json(recipe);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch recipe" },
      { status: 500 }
    );
  }
}

// Create recipe
export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recipe } = await req.json();

  if (!recipe) {
    return NextResponse.json({ error: "Recipe is required" }, { status: 400 });
  }
  try {
    const result = await createRecipeAPI(token, recipe);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 }
    );
  }
}

// Update recipe
export async function PUT(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, recipe } = await req.json();
  try {
    const result = await updateRecipeAPI(token, id, recipe);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }
}

// Delete recipe
export async function DELETE(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Recipe ID is required" },
      { status: 400 }
    );
  }

  try {
    const result = await deleteRecipeAPI(token, id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete recipe" },
      { status: 500 }
    );
  }
}

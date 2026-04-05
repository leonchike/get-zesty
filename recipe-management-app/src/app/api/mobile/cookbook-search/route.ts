import { getUserIdFromJwt } from "@/lib/helpers/get-user-id-from-jwt";
import { searchCookbookRecipes } from "@/lib/actions/cookbook-actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = getUserIdFromJwt(token);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { query, cookbookId, cuisineType, mealType, limit } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "query is required and must be a string" },
        { status: 400 }
      );
    }

    const results = await searchCookbookRecipes(userId, query, {
      cookbookId,
      cuisineType,
      mealType,
      limit,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to search cookbook recipes:", error);
    return NextResponse.json(
      { error: "Failed to search cookbook recipes" },
      { status: 500 }
    );
  }
}

import { fetchRecipesAPI } from "@/features/search-filters/actions/search-actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];

  const params = await req.json();

  try {
    const recipes = await fetchRecipesAPI(token ?? null, params);

    return NextResponse.json(recipes);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mcp/cookbooks/search — RAG/semantic search across cookbook recipes
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import { searchCookbookRecipes } from "@/lib/actions/cookbook-actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, cookbookId, cuisineType, mealType, limit } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const auth = await verifyMCPAuth(req, body);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const results = await searchCookbookRecipes(auth.userId!, query, {
      cookbookId,
      cuisineType,
      mealType,
      limit,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching cookbooks:", error);
    return NextResponse.json(
      { error: "Failed to search cookbooks" },
      { status: 500 }
    );
  }
}

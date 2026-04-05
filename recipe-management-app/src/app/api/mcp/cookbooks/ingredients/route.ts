/**
 * POST /api/mcp/cookbooks/ingredients — Search cookbook recipes by ingredient list
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import { searchByIngredient } from "@/lib/actions/cookbook-actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ingredients, matchAll } = body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: "At least one ingredient is required" },
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

    const results = await searchByIngredient(
      auth.userId!,
      ingredients,
      matchAll ?? false
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching by ingredient:", error);
    return NextResponse.json(
      { error: "Failed to search by ingredient" },
      { status: 500 }
    );
  }
}

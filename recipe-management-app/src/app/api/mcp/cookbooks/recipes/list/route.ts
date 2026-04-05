/**
 * GET /api/mcp/cookbooks/recipes/list — List recipes in a cookbook with pagination
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import { listCookbookRecipes } from "@/lib/actions/cookbook-actions";

export async function GET(req: NextRequest) {
  try {
    const cookbookId = req.nextUrl.searchParams.get("cookbook_id");
    const userId = req.nextUrl.searchParams.get("user_id") || "";
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50", 10);

    if (!cookbookId) {
      return NextResponse.json(
        { error: "cookbook_id is required" },
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

    const result = await listCookbookRecipes(auth.userId!, cookbookId, {
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error listing cookbook recipes:", error);
    return NextResponse.json(
      { error: "Failed to list cookbook recipes" },
      { status: 500 }
    );
  }
}

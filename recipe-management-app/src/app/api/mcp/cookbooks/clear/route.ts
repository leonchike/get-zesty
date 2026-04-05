/**
 * DELETE /api/mcp/cookbooks/clear — Clear all cookbook data for a user
 *
 * Admin/testing endpoint. Deletes Cookbook, CookbookRecipe, and RecipeChunk
 * records (including embeddings) via cascade.
 *
 * Body: { user_id: string, cookbook_id?: string }
 * If cookbook_id is provided, only that cookbook is deleted.
 * Otherwise, all cookbooks for the user are deleted.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import { clearCookbookData } from "@/lib/actions/cookbook-actions";

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

    const result = await clearCookbookData(auth.userId!, body.cookbook_id);

    return NextResponse.json({
      message: "Cookbook data cleared",
      ...result,
    });
  } catch (error) {
    console.error("Error clearing cookbook data:", error);
    return NextResponse.json(
      { error: "Failed to clear cookbook data" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mcp/cookbooks — List cookbooks for user
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import { listCookbooks } from "@/lib/actions/cookbook-actions";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id") || "";
    const sort = req.nextUrl.searchParams.get("sort") || undefined;
    const search = req.nextUrl.searchParams.get("search") || undefined;

    const auth = await verifyMCPAuth(req, { user_id: userId });
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const cookbooks = await listCookbooks(auth.userId!, { sort, search });
    return NextResponse.json(cookbooks);
  } catch (error) {
    console.error("Error listing cookbooks:", error);
    return NextResponse.json(
      { error: "Failed to list cookbooks" },
      { status: 500 }
    );
  }
}

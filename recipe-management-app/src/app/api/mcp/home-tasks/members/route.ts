import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import { getHouseholdMembersBase } from "@/features/home-tasks/actions/household-member-actions";

// Read-only by design: household members are managed in the web app settings.

export async function GET(req: NextRequest) {
  try {
    const user_id = req.nextUrl.searchParams.get("user_id");

    const auth = await verifyMCPAuth(req, { user_id: user_id || undefined });
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const members = await getHouseholdMembersBase(auth.userId!);

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching household members:", error);
    return NextResponse.json(
      { error: "Failed to fetch household members" },
      { status: 500 }
    );
  }
}

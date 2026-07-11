import { NextRequest, NextResponse } from "next/server";
import { getMobileUserId } from "@/lib/helpers/mobile-auth";
import {
  createHouseholdMemberBase,
  getHouseholdMembersBase,
} from "@/features/home-tasks/actions/household-member-actions";

export async function GET(req: NextRequest) {
  const userId = getMobileUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const members = await getHouseholdMembersBase(userId);
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get household members" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const userId = getMobileUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const member = await createHouseholdMemberBase(body, userId);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create member";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

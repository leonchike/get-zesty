import { NextRequest, NextResponse } from "next/server";
import { getMobileUserId } from "@/lib/helpers/mobile-auth";
import {
  deleteHouseholdMemberBase,
  updateHouseholdMemberBase,
} from "@/features/home-tasks/actions/household-member-actions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getMobileUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const member = await updateHouseholdMemberBase(id, body, userId);
    return NextResponse.json(member);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update member";
    const status = message === "Member not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getMobileUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await deleteHouseholdMemberBase(id, userId);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete member";
    const status = message === "Member not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

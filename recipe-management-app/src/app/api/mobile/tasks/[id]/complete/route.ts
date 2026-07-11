import { NextRequest, NextResponse } from "next/server";
import { getMobileUserId } from "@/lib/helpers/mobile-auth";
import {
  completeHomeTaskBase,
  uncompleteHomeTaskBase,
} from "@/features/home-tasks/actions/home-task-actions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getMobileUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let completedById: string | null | undefined;
  try {
    const body = await req.json();
    completedById = body?.completedById;
  } catch {
    // empty body is fine
  }

  try {
    const task = await completeHomeTaskBase(id, userId, completedById);
    return NextResponse.json(task);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to complete task";
    const status = message === "Task not found" ? 404 : 400;
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
    const task = await uncompleteHomeTaskBase(id, userId);
    return NextResponse.json(task);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to undo completion";
    const status = message === "Task not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getMobileUserId } from "@/lib/helpers/mobile-auth";
import {
  deleteHomeTaskBase,
  updateHomeTaskBase,
} from "@/features/home-tasks/actions/home-task-actions";

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
    const task = await updateHomeTaskBase(id, body, userId);
    return NextResponse.json(task);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update task";
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
    const result = await deleteHomeTaskBase(id, userId);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete task";
    const status = message === "Task not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import { uncompleteHomeTaskBase } from "@/features/home-tasks/actions/home-task-actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const auth = await verifyMCPAuth(req, body);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const { id } = body;
    if (!id) {
      return NextResponse.json(
        { error: "Task id is required" },
        { status: 400 }
      );
    }

    const task = await uncompleteHomeTaskBase(id, auth.userId!);

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error undoing task completion:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to undo completion",
      },
      { status: error instanceof Error && error.message === "Task not found" ? 404 : 500 }
    );
  }
}

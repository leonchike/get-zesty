import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import { consumeInventoryItem } from "@/features/inventory/actions/inventory-actions";

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

    const { id, decrement } = body;
    if (!id) {
      return NextResponse.json(
        { error: "Inventory item ID is required" },
        { status: 400 }
      );
    }

    const step =
      typeof decrement === "number" && decrement >= 1
        ? Math.round(decrement)
        : 1;

    const updated = await consumeInventoryItem(id, auth.userId!, step);
    return NextResponse.json({ inventory: updated });
  } catch (error) {
    console.error("Error consuming inventory item:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to consume inventory item",
      },
      { status: 500 }
    );
  }
}

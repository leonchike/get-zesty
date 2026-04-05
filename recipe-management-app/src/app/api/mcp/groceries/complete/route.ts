import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import prisma from "@/lib/prisma-client";

// Complete grocery item(s)
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

    const { id, ids } = body;

    // Support both single id and multiple ids
    const itemIds = ids || (id ? [id] : []);

    if (itemIds.length === 0) {
      return NextResponse.json(
        { error: "At least one grocery item ID is required" },
        { status: 400 }
      );
    }

    // Verify all items belong to user
    const existingItems = await prisma.groceryItem.findMany({
      where: {
        id: { in: itemIds },
        userId: auth.userId!,
      },
    });

    if (existingItems.length !== itemIds.length) {
      return NextResponse.json(
        {
          error:
            "One or more grocery items not found or do not belong to user",
        },
        { status: 404 }
      );
    }

    // Update items to COMPLETED status
    const result = await prisma.groceryItem.updateMany({
      where: {
        id: { in: itemIds },
        userId: auth.userId!,
      },
      data: {
        status: "COMPLETED",
      },
    });

    // Fetch updated items
    const updatedItems = await prisma.groceryItem.findMany({
      where: {
        id: { in: itemIds },
      },
      include: {
        section: true,
        recipe: true,
      },
    });

    return NextResponse.json({
      count: result.count,
      groceries: updatedItems,
    });
  } catch (error) {
    console.error("Error completing grocery items:", error);
    return NextResponse.json(
      { error: "Failed to complete grocery items" },
      { status: 500 }
    );
  }
}

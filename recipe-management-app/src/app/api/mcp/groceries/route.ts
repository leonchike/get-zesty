import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import {
  getUserGroceriesBase,
  createGroceryItem,
  updateGroceryItem,
  deleteGroceryItemBase,
} from "@/features/groceries/actions/grocery-actions";

// Get user's grocery list
export async function GET(req: NextRequest) {
  try {
    // For GET, we need to parse searchParams for user_id and includeCompleted
    const user_id = req.nextUrl.searchParams.get("user_id");
    const includeCompletedParam = req.nextUrl.searchParams.get("includeCompleted");

    // Default to true if not specified (send full list including completed items)
    const includeCompleted = includeCompletedParam === null ? true : includeCompletedParam === "true";

    const auth = await verifyMCPAuth(req, { user_id: user_id || undefined });

    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    // Use the base function that handles all the logic
    let groceries = await getUserGroceriesBase(auth.userId!);

    // Filter out completed items if includeCompleted is false
    if (!includeCompleted) {
      groceries = groceries.filter(item => item.status !== "COMPLETED");
    }

    return NextResponse.json({ groceries });
  } catch (error) {
    console.error("Error fetching groceries:", error);
    return NextResponse.json(
      { error: "Failed to fetch groceries" },
      { status: 500 }
    );
  }
}

// Create grocery item
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

    const { item } = body;

    if (!item || !item.name) {
      return NextResponse.json(
        { error: "Item with name is required" },
        { status: 400 }
      );
    }

    // Use the function that includes AI classification for grocery sections
    const groceryItem = await createGroceryItem(
      {
        name: item.name,
        quantity: item.quantity || null,
        quantityUnit: item.quantityUnit || null,
        recipeId: item.recipeId || null,
      },
      auth.userId!
    );

    return NextResponse.json({ grocery: groceryItem });
  } catch (error) {
    console.error("Error creating grocery item:", error);
    return NextResponse.json(
      { error: "Failed to create grocery item" },
      { status: 500 }
    );
  }
}

// Update grocery item
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const auth = await verifyMCPAuth(req, body);

    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const { item } = body;

    if (!item || !item.id) {
      return NextResponse.json(
        { error: "Item with id is required" },
        { status: 400 }
      );
    }

    // Use the function that handles section updates and common item tracking
    const updatedGroceryItem = await updateGroceryItem(
      {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        quantityUnit: item.quantityUnit,
        status: item.status,
        sectionId: item.sectionId,
      },
      auth.userId!
    );

    return NextResponse.json({ grocery: updatedGroceryItem });
  } catch (error) {
    console.error("Error updating grocery item:", error);
    return NextResponse.json(
      { error: "Failed to update grocery item" },
      { status: 500 }
    );
  }
}

// Delete grocery item
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

    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Grocery item ID is required" },
        { status: 400 }
      );
    }

    // Use the base function that handles verification and deletion
    const deletedId = await deleteGroceryItemBase(id, auth.userId!);

    return NextResponse.json({ id: deletedId });
  } catch (error) {
    console.error("Error deleting grocery item:", error);
    return NextResponse.json(
      { error: "Failed to delete grocery item" },
      { status: 500 }
    );
  }
}

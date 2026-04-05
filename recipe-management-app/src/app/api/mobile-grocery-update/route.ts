import {
  updateGroceryItemAPI,
  deleteGroceryItemAPI,
  createGroceryItemAPI,
} from "@/features/groceries/actions/grocery-actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = body.data;

  try {
    const createdGroceryItem = await createGroceryItemAPI(token, data);
    return NextResponse.json(createdGroceryItem);
  } catch (error) {
    console.error("Error creating grocery item:", error);
    return NextResponse.json(
      { error: "Failed to create grocery item" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const data = body.data;

  try {
    const updatedGroceryItem = await updateGroceryItemAPI(token, data);
    return NextResponse.json(updatedGroceryItem);
  } catch (error) {
    console.error("Error updating grocery item:", error);
    return NextResponse.json(
      { error: "Failed to update grocery item" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  console.log("body", body);
  const id = body?.id;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const deletedGroceryItem = await deleteGroceryItemAPI(token, id);
    return NextResponse.json(deletedGroceryItem);
  } catch (error) {
    console.error("Error deleting grocery item:", error);
    return NextResponse.json(
      { error: "Failed to delete grocery item" },
      { status: 500 }
    );
  }
}

import { addGroceriesFromRecipeAPI } from "@/features/groceries/actions/grocery-actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { selectedIngredients } = await req.json();
  try {
    const result = await addGroceriesFromRecipeAPI(token, selectedIngredients);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add groceries" },
      { status: 500 }
    );
  }
}

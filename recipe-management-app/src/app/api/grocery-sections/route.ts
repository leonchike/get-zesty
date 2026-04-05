import { NextRequest, NextResponse } from "next/server";
import { getGrocerySections } from "@/features/groceries/actions/grocery-actions";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  console.log("token", token);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const grocerySections = await getGrocerySections();
    return NextResponse.json(grocerySections);
  } catch (error) {
    console.error("Error fetching grocery sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch grocery sections" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getUserGroceriesAPI } from "@/features/groceries/actions/grocery-actions";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  console.log("token", token);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const groceries = await getUserGroceriesAPI(token);
    return NextResponse.json(groceries);
  } catch (error) {
    console.error("Error fetching groceries:", error);
    return NextResponse.json(
      { error: "Failed to fetch groceries" },
      { status: 500 }
    );
  }
}

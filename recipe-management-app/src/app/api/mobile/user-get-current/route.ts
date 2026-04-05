// route to get current user from token

import { getCurrentUserFromIdAPI } from "@/lib/actions/profile-actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await getCurrentUserFromIdAPI(token);
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get current user" },
      { status: 500 }
    );
  }
}

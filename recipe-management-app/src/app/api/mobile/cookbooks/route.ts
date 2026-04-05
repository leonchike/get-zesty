import { getUserIdFromJwt } from "@/lib/helpers/get-user-id-from-jwt";
import { listCookbooks } from "@/lib/actions/cookbook-actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = getUserIdFromJwt(token);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") || undefined;
    const search = searchParams.get("search") || undefined;

    const cookbooks = await listCookbooks(userId, { sort, search });

    return NextResponse.json(cookbooks);
  } catch (error) {
    console.error("Failed to fetch cookbooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch cookbooks" },
      { status: 500 }
    );
  }
}

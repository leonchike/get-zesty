import { fetchFilterOptionsAPI } from "@/features/search-filters/actions/search-actions";
import { NextRequest, NextResponse } from "next/server";
import { FetchFilterOptionsParams } from "@/features/search-filters/actions/search-actions";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params: FetchFilterOptionsParams = await req.json();

  try {
    const filterOptions = await fetchFilterOptionsAPI(token, params);
    return NextResponse.json(filterOptions);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch filter options" },
      { status: 500 }
    );
  }
}

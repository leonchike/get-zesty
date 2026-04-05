import { NextRequest, NextResponse } from "next/server";
import { scrapeRecipeAPI } from "@/lib/actions/recipe-actions";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { url } = await req.json();
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }
  try {
    const result = await scrapeRecipeAPI(url);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to scrape recipe" },
      { status: 500 }
    );
  }
}

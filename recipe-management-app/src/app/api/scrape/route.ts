import { NextRequest, NextResponse } from "next/server";
import { parseRecipe } from "@/lib/functions/recipe-parser";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const recipe = await parseRecipe(url);
    return NextResponse.json({ recipe });
  } catch (error) {
    console.error("Error scraping recipe:", error);
    return NextResponse.json(
      { error: "Failed to scrape recipe" },
      { status: 500 }
    );
  }
}

/*
In terminal run:
curl -X POST http://localhost:3000/api/scrape \
     -H "Content-Type: application/json" \
     -d '{"url": "https://www.islandsmile.org/mutton-curry/"}'

     */

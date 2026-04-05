// app/api/unsplash/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createApi } from "unsplash-js";
import nodeFetch from "node-fetch";

// Initialize the Unsplash API client
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY!,
  fetch: nodeFetch as unknown as typeof fetch,
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "64");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const result = await unsplash.search.getPhotos({
      query,
      page,
      perPage,
      orderBy: "relevant",
    });

    if (result.type === "success") {
      return NextResponse.json({
        photos: result.response.results,
        total: result.response.total,
        totalPages: result.response.total_pages,
      });
    } else {
      throw new Error("Failed to fetch photos from Unsplash");
    }
  } catch (error) {
    console.error("Unsplash API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

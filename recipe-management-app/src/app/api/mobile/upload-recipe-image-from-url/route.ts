import { uploadRecipeImageFromUrl } from "@/lib/actions/recipe-actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageUrl } = await req.json();
  if (!imageUrl) {
    return NextResponse.json(
      {
        success: false,
        error: "Image URL is required",
      },
      { status: 400 }
    );
  }

  try {
    const result = await uploadRecipeImageFromUrl(imageUrl);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload image",
      },
      { status: 500 }
    );
  }
}

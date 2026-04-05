import { NextRequest, NextResponse } from "next/server";
import { requestOneTimeUploadUrl } from "@/lib/actions/recipe-actions";

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("🎯 Incoming GET request to generate upload URL");
  try {
    const response = await requestOneTimeUploadUrl();

    if (!response.uploadURL || !response.id) {
      return NextResponse.json(
        { error: "Failed to generate upload URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: response.uploadURL, id: response.id });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

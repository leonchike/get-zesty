import { editUserProfileAPI } from "@/lib/actions/profile-actions";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profileData } = await req.json();

  if (!profileData) {
    return NextResponse.json({ error: "No data provided" }, { status: 400 });
  }

  try {
    const response = await editUserProfileAPI(token, profileData);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}

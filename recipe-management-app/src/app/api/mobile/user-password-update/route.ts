import { updateUserPasswordAPI } from "@/lib/actions/profile-actions";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data: passwordData } = await req.json();

  if (!passwordData) {
    return NextResponse.json({ error: "No data provided" }, { status: 400 });
  }

  try {
    const response = await updateUserPasswordAPI(token, passwordData);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update user password", success: false },
      { status: 500 }
    );
  }
}

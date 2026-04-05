// app/api/auth/set-password/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    const body = await req.json();
    const { email, password } = body?.data;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers }
      );
    }

    // Check if password is already set
    if (user.password) {
      return NextResponse.json(
        { error: "Password is already set" },
        { status: 400, headers }
      );
    }

    // Hash and set the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: updatedUser.id,
        email: updatedUser.email,
      },
      JWT_SECRET,
      { expiresIn: "365d" }
    );

    return NextResponse.json(
      {
        token,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          image: updatedUser.image,
        },
      },
      { headers }
    );
  } catch (error) {
    console.error("Set password error:", error);
    return NextResponse.json(
      { error: "Failed to set password" },
      { status: 500, headers }
    );
  }
}

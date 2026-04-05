import { NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  // Add CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*", // Be more restrictive in production
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle OPTIONS request (preflight)
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  try {
    const body = await req.json();

    const { email, name, googleId, picture } = body?.data;

    if (!email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // if (!user) {
    //   // Create new user if they don't exist
    //   user = await prisma.user.create({
    //     data: {
    //       email,
    //       name,
    //       image: picture,
    //       accounts: {
    //         create: {
    //           type: "oauth",
    //           provider: "google",
    //           providerAccountId: googleId,
    //         },
    //       },
    //     },
    //   });
    // }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "365d" }
    );

    console.log("token", token);
    console.log("user", user);
    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        },
      },
      { headers }
    );
  } catch (error) {
    console.error("Google authentication error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500, headers }
    );
  }
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

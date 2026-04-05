import { NextRequest } from "next/server";
import prisma from "@/lib/prisma-client";

interface MCPAuthResult {
  success: boolean;
  userId?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Verifies MCP API authentication
 * - Checks X-API-Key header against MCP_API_KEY environment variable
 * - Validates user_id from request body
 * - Ensures user exists in database
 *
 * @param req - NextRequest object
 * @param body - Request body containing user_id
 * @returns MCPAuthResult with success status and userId or error
 */
export async function verifyMCPAuth(
  req: NextRequest,
  body: { user_id?: string }
): Promise<MCPAuthResult> {
  // Check API key
  const apiKey = req.headers.get("X-API-Key");
  const validApiKey = process.env.MCP_API_KEY;

  if (!validApiKey) {
    console.error("MCP_API_KEY not configured in environment");
    return {
      success: false,
      error: "Server configuration error",
      statusCode: 500,
    };
  }

  if (!apiKey) {
    return {
      success: false,
      error: "Missing X-API-Key header",
      statusCode: 401,
    };
  }

  if (apiKey !== validApiKey) {
    return {
      success: false,
      error: "Invalid API key",
      statusCode: 401,
    };
  }

  // Validate user_id
  const userId = body.user_id;

  if (!userId) {
    return {
      success: false,
      error: "Missing user_id in request body",
      statusCode: 400,
    };
  }

  // Verify user exists — try direct ID first, then fall back to provider account ID
  try {
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      // Fall back: look up by OAuth provider account ID
      const account = await prisma.account.findFirst({
        where: { providerAccountId: userId },
        select: { userId: true },
      });

      if (account) {
        user = await prisma.user.findUnique({
          where: { id: account.userId },
          select: { id: true },
        });
      }
    }

    if (!user) {
      return {
        success: false,
        error: "User not found",
        statusCode: 404,
      };
    }

    return {
      success: true,
      userId: user.id,
    };
  } catch (error) {
    console.error("Error verifying user:", error);
    return {
      success: false,
      error: "Database error",
      statusCode: 500,
    };
  }
}

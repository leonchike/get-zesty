import { NextRequest } from "next/server";
import { getUserIdFromJwt } from "@/lib/helpers/get-user-id-from-jwt";

/**
 * Resolve the authenticated user from a mobile request's Bearer token.
 * Returns null when the header is missing or the token is invalid/expired.
 */
export function getMobileUserId(req: NextRequest): string | null {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) return null;

  try {
    return getUserIdFromJwt(token);
  } catch {
    return null;
  }
}

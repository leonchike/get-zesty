/**
 * Vercel Cron target. Configured in vercel.json to fire every minute.
 *
 * Auth: Vercel Cron sets `Authorization: Bearer ${CRON_SECRET}` automatically
 * when CRON_SECRET is set as a project env var. We reject anything else so
 * random callers can't drain OpenAI credits.
 *
 * This route also accepts a shared-secret Authorization header for manual
 * invocation during dev (same header format; same CRON_SECRET value).
 */

import { NextRequest, NextResponse } from "next/server";
import { runBatch } from "@/lib/jobs/runner";

// Give ourselves headroom inside Vercel's 60s Node runtime.
const MAX_DURATION_MS = 50_000;

// Ask Vercel to allow up to 60s for this specific route.
// Requires Pro plan for >10s. Free tier users should set this to 9_000
// and shorten MAX_DURATION_MS to ~7_000 accordingly.
export const maxDuration = 60;

// Never cache; always do fresh work.
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // If no secret is configured, refuse to run. Fail closed.
    return false;
  }
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workerId = `vercel-cron-${Math.random().toString(36).slice(2, 10)}`;
  try {
    const result = await runBatch({
      workerId,
      maxDurationMs: MAX_DURATION_MS,
    });
    return NextResponse.json({ ok: true, workerId, ...result });
  } catch (err) {
    console.error("[/api/jobs/run] fatal", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// Accept POST too — useful if you ever want to trigger manually from
// a local terminal: curl -X POST -H "Authorization: Bearer $SECRET" ...
export const POST = GET;

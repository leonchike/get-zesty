/**
 * Long-running local worker. For production on Vercel, use the cron route:
 *   /api/jobs/run (configured in vercel.json)
 *
 * Run:   npm run worker
 * Stop:  Ctrl-C (graceful: finishes the current batch, then exits)
 */

import { config } from "dotenv";
config({ override: true });

import prisma from "../src/lib/prisma-client";
import { runBatch } from "../src/lib/jobs/runner";

const WORKER_ID = `local-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const POLL_INTERVAL_MS = 2000;
// Each "batch" invocation mirrors what Vercel Cron would do.
const BATCH_MAX_MS = 30_000;

let shuttingDown = false;
process.on("SIGINT", () => {
  console.log("[worker] SIGINT received, finishing current batch and exiting...");
  shuttingDown = true;
});
process.on("SIGTERM", () => {
  shuttingDown = true;
});

async function main() {
  console.log(`[worker ${WORKER_ID}] starting`);
  while (!shuttingDown) {
    const result = await runBatch({
      workerId: WORKER_ID,
      maxDurationMs: BATCH_MAX_MS,
    });
    if (result.processed > 0) {
      console.log(
        `[worker ${WORKER_ID}] processed=${result.processed} succeeded=${result.succeeded} retried=${result.retried} failed=${result.failed} (${result.durationMs}ms)`
      );
    } else {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
  await prisma.$disconnect();
  console.log(`[worker ${WORKER_ID}] shut down`);
}

main().catch(async (err) => {
  console.error("[worker] fatal", err);
  await prisma.$disconnect();
  process.exit(1);
});

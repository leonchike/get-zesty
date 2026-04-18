/**
 * Job worker. Pulls jobs off the "Job" table using FOR UPDATE SKIP LOCKED
 * so multiple workers can safely run concurrently.
 *
 * Run:   npm run worker        (see package.json)
 * Stop:  Ctrl-C (graceful: finishes the current job, then exits)
 */

import { config } from "dotenv";
config({ override: true });

import prisma from "../src/lib/prisma-client";
import { runJob } from "../src/lib/jobs/handlers";
import { backoffMs, MAX_ATTEMPTS, type JobType } from "../src/lib/jobs/enqueue";

const WORKER_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const POLL_INTERVAL_MS = 2000;

interface JobRow {
  id: string;
  type: string;
  payload: unknown;
  attempts: number;
}

let shuttingDown = false;
process.on("SIGINT", () => {
  console.log("[worker] SIGINT received, finishing current job and exiting...");
  shuttingDown = true;
});
process.on("SIGTERM", () => {
  shuttingDown = true;
});

async function pickNextJob(): Promise<JobRow | null> {
  const rows = await prisma.$queryRaw<JobRow[]>`
    UPDATE "Job"
    SET state = 'running',
        "lockedAt" = now(),
        "lockedBy" = ${WORKER_ID},
        attempts = attempts + 1,
        "updatedAt" = now()
    WHERE id = (
      SELECT id FROM "Job"
      WHERE state = 'pending'
        AND "runAfter" <= now()
      ORDER BY "runAfter" ASC, "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id, type, payload, attempts
  `;
  return rows[0] ?? null;
}

async function markDone(id: string) {
  await prisma.job.update({
    where: { id },
    data: {
      state: "done",
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    },
  });
}

async function markRetryOrFailed(id: string, attempts: number, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (attempts >= MAX_ATTEMPTS) {
    await prisma.job.update({
      where: { id },
      data: {
        state: "failed",
        lastError: message,
        lockedAt: null,
        lockedBy: null,
      },
    });
    return;
  }
  const delay = backoffMs(attempts);
  await prisma.job.update({
    where: { id },
    data: {
      state: "pending",
      lastError: message,
      runAfter: new Date(Date.now() + delay),
      lockedAt: null,
      lockedBy: null,
    },
  });
}

async function runOnce(): Promise<boolean> {
  const job = await pickNextJob();
  if (!job) return false;

  console.log(`[worker ${WORKER_ID}] running job ${job.id} (${job.type}, attempt ${job.attempts})`);
  try {
    await runJob(job.type as JobType, job.payload);
    await markDone(job.id);
    console.log(`[worker ${WORKER_ID}] job ${job.id} done`);
  } catch (err) {
    console.error(`[worker ${WORKER_ID}] job ${job.id} failed:`, err);
    await markRetryOrFailed(job.id, job.attempts, err);
  }
  return true;
}

async function main() {
  console.log(`[worker ${WORKER_ID}] starting`);
  while (!shuttingDown) {
    const ran = await runOnce();
    if (!ran) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
  await prisma.$disconnect();
  console.log(`[worker ${WORKER_ID}] shut down`);
}

main().catch((err) => {
  console.error("[worker] fatal", err);
  process.exit(1);
});

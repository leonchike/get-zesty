/**
 * Shared job-runner primitives used by both:
 *  - scripts/worker.ts     — local dev, long-running
 *  - /api/jobs/run         — Vercel Cron, bounded per invocation
 *
 * The atomic pickup query (FOR UPDATE SKIP LOCKED) lets multiple
 * workers run safely in parallel.
 */

import prisma from "@/lib/prisma-client";
import { runJob } from "./handlers";
import { backoffMs, MAX_ATTEMPTS, type JobType } from "./enqueue";

export interface JobRow {
  id: string;
  type: string;
  payload: unknown;
  attempts: number;
}

export interface RunBatchOptions {
  /** Unique tag stored in `lockedBy`; helps trace which worker ran a job. */
  workerId: string;
  /** Hard ceiling on total wall-clock spent in this batch (ms). */
  maxDurationMs: number;
  /** Hard ceiling on number of jobs to process. */
  maxJobs?: number;
}

export interface RunBatchResult {
  processed: number;
  succeeded: number;
  failed: number;
  retried: number;
  durationMs: number;
}

export async function pickNextJob(workerId: string): Promise<JobRow | null> {
  const rows = await prisma.$queryRaw<JobRow[]>`
    UPDATE "Job"
    SET state = 'running',
        "lockedAt" = now(),
        "lockedBy" = ${workerId},
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

export async function markDone(id: string): Promise<void> {
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

/** Returns true if retried, false if terminally failed. */
export async function markRetryOrFailed(
  id: string,
  attempts: number,
  error: unknown
): Promise<boolean> {
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
    return false;
  }
  await prisma.job.update({
    where: { id },
    data: {
      state: "pending",
      lastError: message,
      runAfter: new Date(Date.now() + backoffMs(attempts)),
      lockedAt: null,
      lockedBy: null,
    },
  });
  return true;
}

/**
 * Pick + run jobs until we either run out of pending work, hit maxJobs,
 * or approach maxDurationMs. Safe to invoke concurrently from multiple
 * processes/workers — SKIP LOCKED handles coordination.
 */
export async function runBatch(opts: RunBatchOptions): Promise<RunBatchResult> {
  const started = Date.now();
  const result: RunBatchResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    retried: 0,
    durationMs: 0,
  };

  while (true) {
    if (Date.now() - started >= opts.maxDurationMs) break;
    if (opts.maxJobs !== undefined && result.processed >= opts.maxJobs) break;

    const job = await pickNextJob(opts.workerId);
    if (!job) break;

    result.processed += 1;
    try {
      await runJob(job.type as JobType, job.payload);
      await markDone(job.id);
      result.succeeded += 1;
    } catch (err) {
      const retried = await markRetryOrFailed(job.id, job.attempts, err);
      if (retried) result.retried += 1;
      else result.failed += 1;
    }
  }

  result.durationMs = Date.now() - started;
  return result;
}

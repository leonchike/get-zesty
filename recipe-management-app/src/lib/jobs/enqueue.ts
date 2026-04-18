/**
 * Job enqueue helpers. Pair with scripts/worker.ts.
 */

import prisma from "@/lib/prisma-client";

export type JobType = "embed_recipe";

export interface JobPayloads {
  embed_recipe: { recipeId: string };
}

/**
 * Enqueue an embed_recipe job. Safe to call from a server action or API route;
 * it never blocks on external work (just a DB insert).
 *
 * Dedup: if a pending/running embed job for this recipe already exists,
 * skip enqueueing — the next pickup will already capture the latest content.
 */
export async function enqueueEmbedRecipe(recipeId: string): Promise<void> {
  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "Job"
    WHERE type = 'embed_recipe'
      AND state IN ('pending', 'running')
      AND payload->>'recipeId' = ${recipeId}
    LIMIT 1
  `;
  if (existing.length > 0) return;

  await prisma.job.create({
    data: {
      type: "embed_recipe",
      payload: { recipeId } as JobPayloads["embed_recipe"],
    },
  });
}

/**
 * Back-off delay in ms for the Nth attempt (1-indexed).
 * Exponential with jitter, capped at 5 minutes.
 */
export function backoffMs(attempt: number): number {
  const base = Math.min(1000 * 2 ** (attempt - 1), 5 * 60 * 1000);
  const jitter = Math.random() * (base * 0.25);
  return Math.floor(base + jitter);
}

export const MAX_ATTEMPTS = 5;

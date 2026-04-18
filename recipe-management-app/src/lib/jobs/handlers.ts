/**
 * Job handlers. One function per JobType.
 * Kept separate from the worker loop so we can unit-test handlers
 * without the polling machinery.
 */

import prisma from "@/lib/prisma-client";
import { generateEmbedding } from "@/lib/embeddings";
import type { JobPayloads, JobType } from "./enqueue";

export type JobHandler<K extends JobType> = (payload: JobPayloads[K]) => Promise<void>;

export const handlers: { [K in JobType]: JobHandler<K> } = {
  async embed_recipe({ recipeId }) {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, title: true, description: true, ingredients: true },
    });
    if (!recipe) {
      // Recipe was deleted between enqueue and run — nothing to do.
      return;
    }

    const text = [recipe.title, recipe.description ?? "", recipe.ingredients ?? ""]
      .filter(Boolean)
      .join("\n");

    const embedding = await generateEmbedding(text);
    const literal = `[${embedding.join(",")}]`;

    await prisma.$executeRawUnsafe(
      `UPDATE "Recipe"
         SET embedding = $1::vector,
             "embeddingUpdatedAt" = now()
       WHERE id = $2`,
      literal,
      recipeId
    );
  },
};

export async function runJob(
  type: JobType,
  payload: unknown
): Promise<void> {
  const handler = handlers[type] as JobHandler<JobType>;
  if (!handler) throw new Error(`Unknown job type: ${type}`);
  await handler(payload as JobPayloads[typeof type]);
}

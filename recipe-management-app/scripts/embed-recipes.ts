/**
 * One-shot: backfill embeddings on all Recipe rows that don't have one yet.
 *
 * Run: npm run embed-recipes
 * Idempotent: re-runs only embed rows where embedding IS NULL.
 *
 * Uses OpenAI's batched embeddings endpoint (up to 100 inputs per call)
 * and a token-bucket rate limiter to stay inside the Tier-1 limit.
 */

import { config } from "dotenv";
config({ override: true });

import prisma from "../src/lib/prisma-client";
import { RateLimiter } from "./lib/rate-limiter";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 100;
// OpenAI Tier 1 allows 3,000 embeddings RPM. Stay well under.
const REQUESTS_PER_SECOND = 20;

async function batchEmbed(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const cleaned = texts.map((t) => t.replace(/\s+/g, " ").trim().slice(0, 8000));
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: cleaned,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI embedding error: ${res.status} — ${await res.text()}`);
  }
  const data = (await res.json()) as {
    data: Array<{ embedding: number[]; index: number }>;
  };
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

async function main() {
  const limiter = new RateLimiter(REQUESTS_PER_SECOND);
  let totalDone = 0;

  // Count up front so progress output is meaningful.
  const totalPending = await prisma.$queryRaw<Array<{ c: bigint }>>`
    SELECT count(*)::bigint AS c FROM "Recipe"
    WHERE "isDeleted" = false AND embedding IS NULL
  `;
  const remaining = Number(totalPending[0]?.c ?? 0);
  console.log(`[embed-recipes] ${remaining} recipes need embedding`);

  if (remaining === 0) {
    await prisma.$disconnect();
    return;
  }

  while (true) {
    // Fetch a batch of rows still missing an embedding.
    const batch = await prisma.$queryRaw<
      Array<{ id: string; title: string; description: string | null; ingredients: string | null }>
    >`
      SELECT id, title, description, ingredients FROM "Recipe"
      WHERE "isDeleted" = false AND embedding IS NULL
      ORDER BY "updatedAt" DESC
      LIMIT ${BATCH_SIZE}
    `;
    if (batch.length === 0) break;

    const texts = batch.map((r) =>
      [r.title, r.description ?? "", r.ingredients ?? ""]
        .filter(Boolean)
        .join("\n")
    );

    await limiter.acquire();
    const vectors = await batchEmbed(texts);

    // Persist in parallel — each update is a tiny SQL statement.
    await Promise.all(
      batch.map((row, idx) => {
        const literal = `[${vectors[idx].join(",")}]`;
        return prisma.$executeRawUnsafe(
          `UPDATE "Recipe" SET embedding = $1::vector, "embeddingUpdatedAt" = now() WHERE id = $2`,
          literal,
          row.id
        );
      })
    );

    totalDone += batch.length;
    console.log(`[embed-recipes] embedded ${totalDone}/${remaining}`);
  }

  console.log(`[embed-recipes] done — ${totalDone} recipes embedded`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("[embed-recipes] fatal", err);
  await prisma.$disconnect();
  process.exit(1);
});

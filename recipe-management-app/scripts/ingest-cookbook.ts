/**
 * CLI orchestrator for the cookbook ingestion pipeline.
 *
 * Usage:
 *   npm run ingest-cookbook -- /path/to/cookbook.pdf --user-id <userId> [--resume]
 *
 * Supported formats: PDF, EPUB (native), MOBI/AZW/AZW3/FB2/DJVU/CBZ/CBR (via Calibre)
 *
 * Stages:
 *   1. CLI validation
 *   2. Text extraction (format-aware)
 *   3. Cookbook metadata extraction (Claude Haiku)
 *   4. Recipe boundary detection (Claude Sonnet, windowed)
 *   5. Recipe detail extraction (Claude Sonnet, per recipe)
 *   6. Database persistence (Prisma)
 *   7. Chunk creation + embedding (OpenAI)
 */

import * as dotenv from "dotenv";
dotenv.config({ override: true });

import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";

import { extractText, cleanupTempFiles } from "./lib/text-extractor";
import { isSupportedFormat, SUPPORTED_EXTENSIONS } from "./lib/ebook-converter";
import { extractCookbookMetadata } from "./lib/cookbook-metadata";
import { detectRecipeBoundaries } from "./lib/recipe-detector";
import { getRecipeText, extractSingleRecipe } from "./lib/recipe-extractor";
import {
  ensureCookbook,
  persistSingleRecipe,
  finalizeCookbook,
} from "./lib/recipe-persister";
import { createAndEmbedChunksForRecipe } from "./lib/chunk-embedder";
import { pMap } from "./lib/rate-limiter";
import { MAX_CONCURRENT_RECIPES, PageTextMap } from "./lib/pipeline-types";

// --- CLI argument parsing ---

function parseArgs(): {
  filePath: string;
  userId: string;
  resume: boolean;
} {
  const args = process.argv.slice(2);

  const filePath = args.find((a) => !a.startsWith("--"));
  const userId =
    args[args.indexOf("--user-id") + 1] ?? args[args.indexOf("-u") + 1];
  const resume = args.includes("--resume");

  const usage =
    "Usage: npm run ingest-cookbook -- /path/to/cookbook.[pdf|epub|mobi|...] --user-id <userId> [--resume]";

  if (!filePath) {
    console.error("Error: File path is required.");
    console.error(usage);
    process.exit(1);
  }

  if (!userId) {
    console.error("Error: --user-id is required.");
    console.error(usage);
    process.exit(1);
  }

  return { filePath: path.resolve(filePath), userId, resume };
}

// --- Main pipeline ---

async function main(): Promise<void> {
  const startTime = Date.now();

  // ===== Stage 1: CLI validation =====
  console.log("\n========== Stage 1: Validation ==========");
  const { filePath, userId, resume } = parseArgs();

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  if (!isSupportedFormat(filePath)) {
    console.error(
      `Error: Unsupported file format. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`
    );
    process.exit(1);
  }

  if (!process.env.CLAUDE_API_KEY) {
    console.error("Error: CLAUDE_API_KEY environment variable not set.");
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY environment variable not set.");
    process.exit(1);
  }

  console.log(`File: ${filePath}`);
  console.log(`User: ${userId}`);
  console.log(`Resume: ${resume}`);

  // Create clients
  const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
    maxRetries: 5,
  });
  // Increase connection pool for concurrent pipeline (default .env may have connection_limit=1)
  const dbUrl = new URL(process.env.DATABASE_URL!);
  dbUrl.searchParams.set("connection_limit", "20");
  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl.toString() } },
  });
  let extraction: Awaited<ReturnType<typeof extractText>> | null = null;

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.error(`Error: User not found: ${userId}`);
      process.exit(1);
    }
    console.log(`User verified: ${user.email}`);

    // ===== Stage 2: Text extraction =====
    console.log("\n========== Stage 2: Text Extraction ==========");
    extraction = await extractText(filePath, anthropic);
    const { pageTexts } = extraction;

    if (pageTexts.size === 0) {
      console.error("Error: No text could be extracted from the file.");
      cleanupTempFiles(extraction);
      process.exit(1);
    }

    // ===== Stage 3: Cookbook metadata =====
    console.log("\n========== Stage 3: Cookbook Metadata ==========");
    const metadata = await extractCookbookMetadata(
      anthropic,
      pageTexts,
      filePath,
      extraction.embeddedOpfXml
    );

    // ===== Stage 4: Recipe boundary detection =====
    console.log("\n========== Stage 4: Recipe Boundary Detection ==========");
    const boundaries = await detectRecipeBoundaries(anthropic, pageTexts);

    if (boundaries.length === 0) {
      console.error("Error: No recipes detected in the cookbook.");
      process.exit(1);
    }

    // ===== Stages 5+6+7: Streaming Extract → Persist → Embed =====
    console.log(
      "\n========== Stages 5+6+7: Extract → Persist → Embed ==========",
    );

    // 1. Create/find cookbook record
    const { cookbookId, existingRecipeTitles } = await ensureCookbook(prisma, {
      userId,
      filePath,
      metadata,
      totalPages: pageTexts.size,
      resume,
    });

    // 2. Stream each boundary through extract → persist → embed
    const results = await pMap(
      boundaries,
      async (boundary, index) => {
        // Extract
        const recipeText = getRecipeText(pageTexts, boundary);
        let extracted: Awaited<ReturnType<typeof extractSingleRecipe>> | null =
          null;
        let lastError: unknown;

        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(
              `[Pipeline] (${index + 1}/${boundaries.length}) "${boundary.title}" (pages ${boundary.startPage}-${boundary.endPage})${attempt > 1 ? ` attempt ${attempt}` : ""}...`,
            );
            extracted = await extractSingleRecipe(
              anthropic,
              boundary,
              recipeText,
            );
            break;
          } catch (err) {
            lastError = err;
            console.warn(
              `[Pipeline] Attempt ${attempt} failed for "${boundary.title}":`,
              err instanceof Error ? err.message : err,
            );
          }
        }

        if (!extracted) {
          console.error(
            `[Pipeline] Skipping "${boundary.title}" after 3 failed attempts: ${lastError instanceof Error ? lastError.message : lastError}`,
          );
          return { persisted: false, skipped: true, chunksCreated: 0, chunksEmbedded: 0 };
        }

        // Skip if already exists (resume)
        if (existingRecipeTitles.has(extracted.title.toLowerCase())) {
          return { persisted: false, skipped: true, chunksCreated: 0, chunksEmbedded: 0 };
        }

        // Persist
        const recipeId = await persistSingleRecipe(
          prisma,
          cookbookId,
          userId,
          extracted,
        );

        // Chunk + Embed
        const { chunksCreated, chunksEmbedded } =
          await createAndEmbedChunksForRecipe(
            prisma,
            {
              id: recipeId,
              title: extracted.title,
              description: extracted.description ?? null,
              ingredients: extracted.ingredients,
              instructions: extracted.instructions,
            },
            resume,
          );

        console.log(
          `[Pipeline] ✓ "${extracted.title}" → ${chunksCreated} chunks, ${chunksEmbedded} embedded`,
        );

        return { persisted: true, skipped: false, chunksCreated, chunksEmbedded };
      },
      MAX_CONCURRENT_RECIPES,
    );

    // 3. Finalize cookbook
    await finalizeCookbook(prisma, cookbookId);

    // 4. Aggregate results
    const totals = results.reduce(
      (acc, r) => ({
        persisted: acc.persisted + (r.persisted ? 1 : 0),
        skipped: acc.skipped + (r.skipped ? 1 : 0),
        chunksCreated: acc.chunksCreated + r.chunksCreated,
        chunksEmbedded: acc.chunksEmbedded + r.chunksEmbedded,
      }),
      { persisted: 0, skipped: 0, chunksCreated: 0, chunksEmbedded: 0 },
    );

    // ===== Summary =====
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("\n========== Done ==========");
    console.log(`Cookbook: "${metadata.title}" (${cookbookId})`);
    console.log(`Pages: ${pageTexts.size}`);
    console.log(
      `Recipes: ${totals.persisted} new, ${totals.skipped} skipped`,
    );
    console.log(
      `Chunks: ${totals.chunksCreated} created, ${totals.chunksEmbedded} embedded`,
    );
    console.log(`Time: ${elapsed}s`);
  } finally {
    if (extraction) cleanupTempFiles(extraction);
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});

/**
 * @jest-environment node
 *
 * Integration test for the cookbook ingestion pipeline.
 *
 * Requires:
 *   - CLAUDE_API_KEY and OPENAI_API_KEY environment variables
 *   - A running PostgreSQL database with pgvector
 *   - A test PDF with at least 2 known recipes
 *
 * Skipped in CI (set CI=true to skip).
 * Set TEST_PDF_PATH and TEST_USER_ID environment variables to run.
 */

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const SKIP_REASON =
  !process.env.CLAUDE_API_KEY ||
  !process.env.OPENAI_API_KEY ||
  !process.env.TEST_PDF_PATH ||
  !process.env.TEST_USER_ID ||
  process.env.CI === "true";

const describeOrSkip = SKIP_REASON ? describe.skip : describe;

describeOrSkip("Cookbook Ingestion Pipeline (integration)", () => {
  let prisma: PrismaClient;
  let cookbookId: string | undefined;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    // Cleanup: delete created records
    if (cookbookId) {
      // Cascades delete CookbookRecipes and RecipeChunks
      await prisma.cookbook.delete({ where: { id: cookbookId } }).catch(() => {
        // Ignore if already deleted
      });
    }
    await prisma.$disconnect();
  });

  it("ingests a test PDF through all 7 stages", async () => {
    const testPdfPath = process.env.TEST_PDF_PATH!;
    const testUserId = process.env.TEST_USER_ID!;

    expect(fs.existsSync(testPdfPath)).toBe(true);

    // Import pipeline modules
    const { extractPdfText } = await import("../lib/pdf-extractor");
    const { extractCookbookMetadata } = await import(
      "../lib/cookbook-metadata"
    );
    const { detectRecipeBoundaries } = await import("../lib/recipe-detector");
    const { extractRecipes } = await import("../lib/recipe-extractor");
    const { persistCookbookAndRecipes } = await import(
      "../lib/recipe-persister"
    );
    const { createAndEmbedChunks } = await import("../lib/chunk-embedder");

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });

    // Stage 2: PDF extraction
    const pageTexts = await extractPdfText(testPdfPath);
    expect(pageTexts.size).toBeGreaterThan(0);

    // Stage 3: Metadata
    const metadata = await extractCookbookMetadata(anthropic, pageTexts);
    expect(metadata.title).toBeTruthy();

    // Stage 4: Boundary detection
    const boundaries = await detectRecipeBoundaries(anthropic, pageTexts);
    expect(boundaries.length).toBeGreaterThan(0);

    // Stage 5: Recipe extraction
    const recipes = await extractRecipes(anthropic, pageTexts, boundaries);
    expect(recipes.length).toBeGreaterThan(0);
    expect(recipes[0].ingredients).toBeTruthy();

    // Stage 6: Persistence
    const result = await persistCookbookAndRecipes(
      prisma,
      {
        userId: testUserId,
        filePath: testPdfPath,
        metadata,
        totalPages: pageTexts.size,
        resume: false,
      },
      recipes
    );
    cookbookId = result.cookbookId;

    expect(result.recipeIds.length).toBeGreaterThan(0);

    // Verify DB records
    const cookbook = await prisma.cookbook.findUnique({
      where: { id: cookbookId },
    });
    expect(cookbook).not.toBeNull();
    expect(cookbook!.isProcessed).toBe(true);

    const dbRecipes = await prisma.cookbookRecipe.findMany({
      where: { cookbookId },
    });
    expect(dbRecipes.length).toBe(recipes.length);

    // Stage 7: Chunk + Embed
    const embedResult = await createAndEmbedChunks(prisma, cookbookId, false);
    expect(embedResult.chunksCreated).toBeGreaterThan(0);
    expect(embedResult.chunksEmbedded).toBeGreaterThan(0);

    // Verify embeddings stored
    const embeddedCount = await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `SELECT count(*) FROM "RecipeChunk"
       WHERE "cookbookRecipeId" IN (
         SELECT id FROM "CookbookRecipe" WHERE "cookbookId" = $1
       )
       AND embedding IS NOT NULL`,
      cookbookId
    );
    expect(Number(embeddedCount[0].count)).toBeGreaterThan(0);
  }, 120000); // 2 minute timeout for API calls
});

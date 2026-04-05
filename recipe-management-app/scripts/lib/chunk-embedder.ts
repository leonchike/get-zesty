/**
 * Stage 7: Create RecipeChunks and generate OpenAI embeddings.
 *
 * For each CookbookRecipe, creates up to 4 chunk types (full, description,
 * ingredients, instructions), then batch-embeds them via OpenAI and stores
 * the vectors using raw SQL (pgvector column not in Prisma schema).
 */

import { PrismaClient } from "@prisma/client";
import { EMBEDDING_BATCH_SIZE, CHUNK_TYPES, ChunkType } from "./pipeline-types";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

interface ChunkInput {
  cookbookRecipeId: string;
  chunkType: ChunkType;
  content: string;
}

/**
 * Build chunk inputs for a single recipe.
 */
function buildChunksForRecipe(recipe: {
  id: string;
  title: string;
  description: string | null;
  ingredients: string | null;
  instructions: string | null;
}): ChunkInput[] {
  const chunks: ChunkInput[] = [];

  // Full: concatenation of all text fields
  const fullParts = [
    recipe.title,
    recipe.description,
    recipe.ingredients,
    recipe.instructions,
  ]
    .filter(Boolean)
    .join("\n\n");

  if (fullParts.trim()) {
    chunks.push({
      cookbookRecipeId: recipe.id,
      chunkType: "full",
      content: fullParts,
    });
  }

  if (recipe.description?.trim()) {
    chunks.push({
      cookbookRecipeId: recipe.id,
      chunkType: "description",
      content: recipe.description,
    });
  }

  if (recipe.ingredients?.trim()) {
    chunks.push({
      cookbookRecipeId: recipe.id,
      chunkType: "ingredients",
      content: recipe.ingredients,
    });
  }

  if (recipe.instructions?.trim()) {
    chunks.push({
      cookbookRecipeId: recipe.id,
      chunkType: "instructions",
      content: recipe.instructions,
    });
  }

  return chunks;
}

/**
 * Generate embeddings for a batch of texts via OpenAI.
 * Uses the array `input` parameter for efficiency.
 */
async function batchEmbed(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const cleanedTexts = texts.map((t) =>
    t.replace(/\s+/g, " ").trim().slice(0, 8000)
  );

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: cleanedTexts,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI embedding API error: ${response.status} - ${errorText}`
    );
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[]; index: number }>;
  };

  // Sort by index to ensure correct order
  const sorted = data.data.sort((a, b) => a.index - b.index);
  return sorted.map((d) => d.embedding);
}

/**
 * Store an embedding vector for a RecipeChunk using raw SQL.
 */
async function storeEmbedding(
  prisma: PrismaClient,
  chunkId: string,
  embedding: number[]
): Promise<void> {
  const vectorStr = `[${embedding.join(",")}]`;
  await prisma.$executeRawUnsafe(
    `UPDATE "RecipeChunk" SET embedding = $1::vector WHERE id = $2`,
    vectorStr,
    chunkId
  );
}

/**
 * Create chunks and generate embeddings for a single recipe.
 * Used by the streaming pipeline (stages 5+6+7 fused).
 */
export async function createAndEmbedChunksForRecipe(
  prisma: PrismaClient,
  recipe: {
    id: string;
    title: string;
    description: string | null;
    ingredients: string;
    instructions: string;
  },
  resume: boolean
): Promise<{ chunksCreated: number; chunksEmbedded: number }> {
  // Check if chunks exist (resume skip logic)
  if (resume) {
    const existingChunks = await prisma.recipeChunk.count({
      where: { cookbookRecipeId: recipe.id },
    });
    if (existingChunks > 0) {
      return { chunksCreated: 0, chunksEmbedded: 0 };
    }
  }

  // Build and create chunk rows
  const chunkInputs = buildChunksForRecipe(recipe);
  let chunksCreated = 0;

  for (const chunk of chunkInputs) {
    await prisma.recipeChunk.create({
      data: {
        cookbookRecipeId: chunk.cookbookRecipeId,
        chunkType: chunk.chunkType,
        content: chunk.content,
      },
    });
    chunksCreated++;
  }

  // Find chunks needing embeddings for this specific recipe
  const chunksToEmbed = await prisma.$queryRawUnsafe<
    Array<{ id: string; content: string }>
  >(
    `SELECT id, content FROM "RecipeChunk"
     WHERE "cookbookRecipeId" = $1
     AND embedding IS NULL`,
    recipe.id
  );

  if (chunksToEmbed.length === 0) {
    return { chunksCreated, chunksEmbedded: 0 };
  }

  // Batch embed (each recipe has ~4 chunks, well within EMBEDDING_BATCH_SIZE)
  const texts = chunksToEmbed.map((c) => c.content);
  const embeddings = await batchEmbed(texts);

  for (let j = 0; j < chunksToEmbed.length; j++) {
    await storeEmbedding(prisma, chunksToEmbed[j].id, embeddings[j]);
  }

  return { chunksCreated, chunksEmbedded: chunksToEmbed.length };
}

/**
 * Create chunks and generate embeddings for cookbook recipes.
 *
 * On resume, only processes chunks with `embedding IS NULL`.
 */
export async function createAndEmbedChunks(
  prisma: PrismaClient,
  cookbookId: string,
  resume: boolean
): Promise<{ chunksCreated: number; chunksEmbedded: number }> {
  // Get all recipes for this cookbook
  const recipes = await prisma.cookbookRecipe.findMany({
    where: { cookbookId },
    select: {
      id: true,
      title: true,
      description: true,
      ingredients: true,
      instructions: true,
    },
  });

  let chunksCreated = 0;

  // Create chunks for recipes that don't have them yet
  for (const recipe of recipes) {
    const existingChunks = await prisma.recipeChunk.count({
      where: { cookbookRecipeId: recipe.id },
    });

    if (existingChunks > 0 && resume) {
      continue; // Skip if resume and chunks already exist
    }

    const chunkInputs = buildChunksForRecipe(recipe);

    for (const chunk of chunkInputs) {
      await prisma.recipeChunk.create({
        data: {
          cookbookRecipeId: chunk.cookbookRecipeId,
          chunkType: chunk.chunkType,
          content: chunk.content,
        },
      });
      chunksCreated++;
    }
  }

  console.log(`[Embedder] Created ${chunksCreated} new chunks.`);

  // Find all chunks that need embeddings
  const chunksToEmbed = await prisma.$queryRawUnsafe<
    Array<{ id: string; content: string }>
  >(
    `SELECT id, content FROM "RecipeChunk"
     WHERE "cookbookRecipeId" IN (
       SELECT id FROM "CookbookRecipe" WHERE "cookbookId" = $1
     )
     AND embedding IS NULL`,
    cookbookId
  );

  console.log(
    `[Embedder] ${chunksToEmbed.length} chunks need embeddings...`
  );

  // Batch embed
  let chunksEmbedded = 0;

  for (let i = 0; i < chunksToEmbed.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = chunksToEmbed.slice(i, i + EMBEDDING_BATCH_SIZE);
    const texts = batch.map((c) => c.content);

    const embeddings = await batchEmbed(texts);

    // Store each embedding
    for (let j = 0; j < batch.length; j++) {
      await storeEmbedding(prisma, batch[j].id, embeddings[j]);
      chunksEmbedded++;
    }

    console.log(
      `[Embedder] Embedded batch ${Math.floor(i / EMBEDDING_BATCH_SIZE) + 1}/${Math.ceil(chunksToEmbed.length / EMBEDDING_BATCH_SIZE)} (${chunksEmbedded}/${chunksToEmbed.length} chunks).`
    );
  }

  console.log(`[Embedder] Done. ${chunksEmbedded} embeddings stored.`);
  return { chunksCreated, chunksEmbedded };
}

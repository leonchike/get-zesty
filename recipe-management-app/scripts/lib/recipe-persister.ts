/**
 * Stage 6: Persist Cookbook and CookbookRecipe records to the database.
 */

import { PrismaClient } from "@prisma/client";
import { CookbookMetadata, ExtractedRecipe } from "./pipeline-types";

export interface PersistCookbookInput {
  userId: string;
  filePath: string;
  metadata: CookbookMetadata;
  totalPages: number;
  resume: boolean;
}

interface PersistResult {
  cookbookId: string;
  recipeIds: string[];
  skippedCount: number;
}

/**
 * Create or find an existing Cookbook record and persist all recipes.
 */
export async function persistCookbookAndRecipes(
  prisma: PrismaClient,
  input: PersistCookbookInput,
  recipes: ExtractedRecipe[]
): Promise<PersistResult> {
  let cookbookId: string;
  let existingRecipeTitles = new Set<string>();

  if (input.resume) {
    // Look for existing cookbook by filePath
    const existing = await prisma.cookbook.findFirst({
      where: { filePath: input.filePath, userId: input.userId },
      include: {
        recipes: { select: { title: true } },
      },
    });

    if (existing) {
      cookbookId = existing.id;
      existingRecipeTitles = new Set(
        existing.recipes.map((r) => r.title.toLowerCase())
      );
      console.log(
        `[Persist] Resuming cookbook "${existing.title}" (${existing.recipes.length} existing recipes).`
      );
    } else {
      // No existing cookbook found, create new
      const cookbook = await createCookbook(prisma, input);
      cookbookId = cookbook.id;
      console.log(
        `[Persist] No existing cookbook found for resume. Created new: "${input.metadata.title}"`
      );
    }
  } else {
    const cookbook = await createCookbook(prisma, input);
    cookbookId = cookbook.id;
    console.log(`[Persist] Created cookbook "${input.metadata.title}"`);
  }

  // Persist recipes, skipping already-existing ones on resume
  const recipeIds: string[] = [];
  let skippedCount = 0;

  for (const recipe of recipes) {
    if (existingRecipeTitles.has(recipe.title.toLowerCase())) {
      skippedCount++;
      continue;
    }

    const created = await prisma.cookbookRecipe.create({
      data: {
        cookbookId,
        userId: input.userId,
        title: recipe.title,
        description: recipe.description ?? null,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        pageNumber: recipe.pageNumber ?? null,
        cuisineType: recipe.cuisineType ?? null,
        mealType: recipe.mealType ?? null,
        servings: recipe.servings ?? null,
        prepTime: recipe.prepTime ?? null,
        cookTime: recipe.cookTime ?? null,
      },
    });

    recipeIds.push(created.id);
  }

  // Update cookbook stats
  const totalRecipes = await prisma.cookbookRecipe.count({
    where: { cookbookId },
  });

  await prisma.cookbook.update({
    where: { id: cookbookId },
    data: {
      recipeCount: totalRecipes,
      isProcessed: true,
    },
  });

  console.log(
    `[Persist] Persisted ${recipeIds.length} new recipes (${skippedCount} skipped). Total: ${totalRecipes}.`
  );

  return { cookbookId, recipeIds, skippedCount };
}

async function createCookbook(
  prisma: PrismaClient,
  input: PersistCookbookInput
) {
  return prisma.cookbook.create({
    data: {
      userId: input.userId,
      title: input.metadata.title,
      author: input.metadata.author,
      publisher: input.metadata.publisher,
      year: input.metadata.year,
      isbn: input.metadata.isbn,
      description: input.metadata.description,
      totalPages: input.totalPages,
      fileType: "pdf",
      filePath: input.filePath,
    },
  });
}

// --- Granular exports for streaming pipeline ---

/**
 * Create or find an existing Cookbook record. Called once before the streaming loop.
 */
export async function ensureCookbook(
  prisma: PrismaClient,
  input: PersistCookbookInput
): Promise<{ cookbookId: string; existingRecipeTitles: Set<string> }> {
  let cookbookId: string;
  let existingRecipeTitles = new Set<string>();

  if (input.resume) {
    const existing = await prisma.cookbook.findFirst({
      where: { filePath: input.filePath, userId: input.userId },
      include: {
        recipes: { select: { title: true } },
      },
    });

    if (existing) {
      cookbookId = existing.id;
      existingRecipeTitles = new Set(
        existing.recipes.map((r) => r.title.toLowerCase())
      );
      console.log(
        `[Persist] Resuming cookbook "${existing.title}" (${existing.recipes.length} existing recipes).`
      );
    } else {
      const cookbook = await createCookbook(prisma, input);
      cookbookId = cookbook.id;
      console.log(
        `[Persist] No existing cookbook found for resume. Created new: "${input.metadata.title}"`
      );
    }
  } else {
    const cookbook = await createCookbook(prisma, input);
    cookbookId = cookbook.id;
    console.log(`[Persist] Created cookbook "${input.metadata.title}"`);
  }

  return { cookbookId, existingRecipeTitles };
}

/**
 * Persist a single recipe to the database. Called per recipe inside the streaming loop.
 */
export async function persistSingleRecipe(
  prisma: PrismaClient,
  cookbookId: string,
  userId: string,
  recipe: ExtractedRecipe
): Promise<string> {
  const created = await prisma.cookbookRecipe.create({
    data: {
      cookbookId,
      userId,
      title: recipe.title,
      description: recipe.description ?? null,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      pageNumber: recipe.pageNumber ?? null,
      cuisineType: recipe.cuisineType ?? null,
      mealType: recipe.mealType ?? null,
      servings: recipe.servings ?? null,
      prepTime: recipe.prepTime ?? null,
      cookTime: recipe.cookTime ?? null,
    },
  });

  return created.id;
}

/**
 * Update cookbook stats after all recipes are processed. Called once after the streaming loop.
 */
export async function finalizeCookbook(
  prisma: PrismaClient,
  cookbookId: string
): Promise<void> {
  const totalRecipes = await prisma.cookbookRecipe.count({
    where: { cookbookId },
  });

  await prisma.cookbook.update({
    where: { id: cookbookId },
    data: {
      recipeCount: totalRecipes,
      isProcessed: true,
    },
  });

  console.log(`[Persist] Finalized cookbook. Total recipes: ${totalRecipes}.`);
}

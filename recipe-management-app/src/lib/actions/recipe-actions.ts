"use server";

// Database and types
import prisma from "@/lib/prisma-client";
import { Prisma, Recipe, RecipeDifficulty, RecipeSource } from "@prisma/client";

// Next.js utilities
import { revalidatePath } from "next/cache";

// Authentication
import { getUser, redirectToLogin } from "@/lib/actions/auth-actions";
import { getUserIdFromJwt } from "@/lib/helpers/get-user-id-from-jwt";

// Image handling
import {
  generateUploadUrl,
  getImageUrl,
  uploadImageFromUrl,
} from "@/lib/image-upload/cloudflare-images";
import { preprocessImage } from "@/lib/functions/image-helpers";

// Recipe parsing and processing
import { parseRecipe } from "@/lib/functions/recipe-parser";
import { parseRecipeComponentsMixed } from "@/lib/functions/ingredients-instructions-parser";
import { detectRecipeFieldChanges } from "@/lib/functions/ingredients-instructions-updater";

// AI and external services
import { generateAiRecipeCaller } from "@/lib/functions/ai-recipe-gen";
import { cleanRecipeWithAI } from "@/lib/functions/ai-scraper-cleaner";
import axios from "axios";

// Async work
import { enqueueEmbedRecipe } from "@/lib/jobs/enqueue";

// Fire-and-forget: enqueue never blocks on external work, but we still
// don't want a DB hiccup here to fail the user's recipe save.
async function enqueueEmbedSafely(recipeId: string): Promise<void> {
  try {
    await enqueueEmbedRecipe(recipeId);
  } catch (err) {
    console.error("[recipe-actions] failed to enqueue embed job", err);
  }
}

// Fields whose changes should trigger re-embedding.
const EMBED_FIELDS = ["title", "description", "ingredients"] as const;

// Start Create recipe functions
export async function createRecipe(
  recipe: Omit<Recipe, "id" | "userId" | "createdAt" | "updatedAt">,
  userId: string | null,
  parseWithAI: boolean = true // <-- new optional parameter
) {
  try {
    if (!userId) throw new Error("Unauthorized");

    const imageUrl = recipe.imageUrl;

    const { parsedIngredients, parsedInstructions } =
      await parseRecipeComponentsMixed(
        recipe.ingredients ?? undefined,
        recipe.instructions ?? undefined,
        parseWithAI
      );

    const newRecipe = await prisma.recipe.create({
      data: {
        ...recipe,
        imageUrl,
        parsedIngredients,
        parsedInstructions,
        userId,
        nutrition: recipe.nutrition ?? undefined,
      },
    });

    await enqueueEmbedSafely(newRecipe.id);
    revalidatePath("/recipes");
    return { id: newRecipe.id };
  } catch (error) {
    console.error("Error creating recipe:", error);
    throw new Error("Failed to create recipe");
  }
}

export async function createRecipeAction(
  recipe: Omit<Recipe, "id" | "userId" | "createdAt" | "updatedAt">,
  parseWithAI?: boolean
) {
  const user = await getUser();
  const userId = user?.id ?? null;
  return createRecipe(recipe, userId, parseWithAI ?? true);
}

export async function createRecipeAPI(
  token: string,
  recipe: Omit<Recipe, "id" | "userId" | "createdAt" | "updatedAt">,
  parseWithAI?: boolean
) {
  try {
    const userId = getUserIdFromJwt(token);
    if (!userId) throw new Error("Unauthorized");
    return createRecipe(recipe, userId, parseWithAI ?? true);
  } catch (error) {
    console.error("Error creating recipe:", error);
    throw new Error("Failed to create recipe");
  }
}
// End Create recipe functions

// Start Update recipe functions
export async function updateRecipe(
  userId: string | null,
  id: string,
  recipe: Partial<Omit<Recipe, "id" | "userId" | "createdAt" | "updatedAt">>,
  parseWithAI?: boolean
) {
  try {
    if (!userId) throw new Error("Unauthorized");

    const existingRecipe = await prisma.recipe.findFirst({
      where: {
        id: id,
        userId: userId,
        isDeleted: false,
      },
    });

    if (!existingRecipe) {
      throw new Error("Recipe not found or does not belong to the user");
    }

    let updateData: any = { ...recipe };

    // Now delegate logic to our helper for ingredients/instructions
    const fieldsToUpdate = await detectRecipeFieldChanges(
      existingRecipe,
      recipe,
      parseWithAI ?? true
    );

    // Merge the fields that changed for ingredients/instructions
    updateData = { ...updateData, ...fieldsToUpdate };

    // Ensure we don't update fields that weren't provided
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedRecipe = await prisma.recipe.update({
      where: { id: id },
      data: updateData,
    });

    // Re-embed only if a field that feeds the embedding actually changed.
    const embedFieldChanged = EMBED_FIELDS.some((f) => {
      const incoming = (updateData as Record<string, unknown>)[f];
      return incoming !== undefined && incoming !== (existingRecipe as any)[f];
    });
    if (embedFieldChanged) {
      await enqueueEmbedSafely(updatedRecipe.id);
    }

    revalidatePath("/recipes");
    return updatedRecipe;
  } catch (error) {
    console.error("Error updating recipe:", error);
    throw new Error("Failed to update recipe");
  }
}

export async function updateRecipeAction(
  id: string,
  recipe: Partial<Omit<Recipe, "id" | "userId" | "createdAt" | "updatedAt">>,
  parseWithAI?: boolean
) {
  const user = await getUser();
  const userId = user?.id ?? null;
  return updateRecipe(userId, id, recipe, parseWithAI ?? true);
}

export async function updateRecipeAPI(
  token: string,
  id: string,
  recipe: Partial<Omit<Recipe, "id" | "userId" | "createdAt" | "updatedAt">>,
  parseWithAI?: boolean
) {
  const userId = getUserIdFromJwt(token);
  return updateRecipe(userId, id, recipe, parseWithAI ?? true);
}
// End Update recipe functions

// Start Delete recipe functions
export async function deleteRecipe(userId: string | null, id: string) {
  try {
    if (!userId) throw new Error("Unauthorized");

    const existingRecipe = await prisma.recipe.findFirst({
      where: {
        id: id,
        userId: userId,
        isDeleted: false,
      },
    });

    if (!existingRecipe) {
      throw new Error("Recipe not found or does not belong to the user");
    }

    const updatedRecipe = await prisma.recipe.update({
      where: { id: id },
      data: { isDeleted: true },
    });

    return updatedRecipe.id;
  } catch (error) {
    console.error("Error soft deleting recipe:", error);
    throw new Error("Failed to soft delete recipe");
  }
}

export async function deleteRecipeAction(id: string) {
  const user = await getUser();
  const userId = user?.id ?? null;
  return deleteRecipe(userId, id);
}

export async function deleteRecipeAPI(token: string, id: string) {
  try {
    const userId = getUserIdFromJwt(token);
    if (!userId) throw new Error("Unauthorized");
    return deleteRecipe(userId, id);
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw new Error("Failed to delete recipe");
  }
}
// End Delete recipe functions

// Mobile Image File Upload
// export async function uploadRecipeImageFromFile(file: File) {
//   const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
//   try {
//     const response = await requestOneTimeUploadUrl();
//     const uploadUrl = response.uploadURL;
//     const id = response.id;

//     const formData = new FormData();

//     formData.append("file", file, "image.webp");

//     const processedImage = await preprocessImage(file);

//     if (processedImage.size > MAX_FILE_SIZE) {
//       throw new Error("Processed image is too large");
//     }

//     formData.append("file", processedImage, "image.webp");

//     const uploadResponse = await axios.post(uploadUrl, formData, {
//       headers: { "Content-Type": "multipart/form-data" },
//     });

//     if (uploadResponse.status !== 200) {
//       throw new Error("Failed to upload image");
//     }

//     const imageUrl = `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH}/${id}/largeartwork`;
//     return { success: true, imageUrl };
//   } catch (error) {
//     console.error("Error uploading image from file:", error);
//     return { success: false, error: "Failed to upload image" };
//   }
// }
/**
 * 1) Accept a raw buffer (already read from the request).
 * 2) Optionally process/resize with sharp.
 * 3) Upload to Cloudflare via formData.
 */
// Mobile Image File Upload
export async function uploadRecipeImageFromFile(file: File) {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  try {
    const response = await requestOneTimeUploadUrl();
    const uploadUrl = response.uploadURL;
    const id = response.id;

    const formData = new FormData();

    formData.append("file", file, "image.webp");

    const processedImage = await preprocessImage(file);

    if (processedImage.size > MAX_FILE_SIZE) {
      throw new Error("Processed image is too large");
    }

    formData.append("file", processedImage, "image.webp");

    const uploadResponse = await axios.post(uploadUrl, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (uploadResponse.status !== 200) {
      throw new Error("Failed to upload image");
    }

    const imageUrl = `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH}/${id}/largeartwork`;
    return { success: true, imageUrl };
  } catch (error) {
    console.error("Error uploading image from file:", error);
    return { success: false, error: "Failed to upload image" };
  }
}

export async function requestOneTimeUploadUrl() {
  try {
    const response = await generateUploadUrl();
    return response;
  } catch (error) {
    console.error("Error requesting one-time upload URL:", error);
    throw new Error("Failed to request one-time upload URL");
  }
}

export async function scrapeRecipe(url: string) {
  try {
    const recipe = await parseRecipe(url);
    return { success: true, data: recipe };
  } catch (error) {
    console.error("Error scraping recipe:", error);
    return {
      success: false,
      error: "Failed to scrape recipe. Please check the URL and try again.",
    };
  }
}

// Utility function to extract and validate image URLs
function extractAndValidateImageUrl(input: any): string | undefined {
  let imageUrl: string | undefined;

  if (typeof input === "string") {
    imageUrl = input;
  } else if (typeof input === "object" && input !== null) {
    // Attempt to extract URL from known properties // reference to nyt recipe parser
    /* sample nyt recipe parser object

    Invalid image URL: {
      '@id': 'nyt://image/39e74093-7f24-5779-8221-9879f0cecf93#videoSixteenByNineJumbo1600',
      '@type': 'ImageObject',
      caption: 'Guacamole.',
      contentUrl: 'https://static01.nyt.com/images/2020/01/28/dining/guacamole/guacamole-videoSixteenByNineJumbo1600.jpg',
      creditText: 'Linda Xiao for The New York Times. Food Stylist: Monica Pierini.',
      dateModified: '2024-02-01T21:01:27.303Z',
      datePublished: '2020-01-28T22:24:18.000Z',
      height: '900',
      representativeOfPage: true,
      uploadDate: '2020-01-28T22:24:18.000Z',
      url: 'https://static01.nyt.com/images/2020/01/28/dining/guacamole/guacamole-videoSixteenByNineJumbo1600.jpg',
      width: '1600'
    }
      */

    imageUrl =
      input.url ||
      input.contentUrl ||
      input.imageUrl ||
      input.image ||
      input.image_url;
  }

  // Validate the extracted URL
  if (imageUrl && isValidImageUrl(imageUrl)) {
    return imageUrl;
  }

  console.warn("Invalid image URL:", input);
  return undefined;
}

// Utility function to validate image URLs
function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch (error) {
    return false;
  }
}

export async function scrapeRecipeAPI(url: string) {
  try {
    const scrapedRecipe = await parseRecipe(url);

    if (!scrapedRecipe) {
      throw new Error("Failed to scrape recipe");
    }

    // Clean the scraped recipe with AI
    const cleanedRecipe = await cleanRecipeWithAI({
      title: scrapedRecipe.title,
      description: scrapedRecipe.description,
      ingredients: scrapedRecipe.ingredients,
      instructions: scrapedRecipe.instructions,
      prepTime: scrapedRecipe.prepTime,
      cookTime: scrapedRecipe.cookTime,
      restTime: scrapedRecipe.restTime,
      servings: scrapedRecipe.servings,
      notes: scrapedRecipe.notes,
      utensils: scrapedRecipe.utensils,
    });

    // Validate and handle the image URL
    if (scrapedRecipe.imageUrl && cleanedRecipe) {
      const validImageUrl = extractAndValidateImageUrl(scrapedRecipe.imageUrl);
      if (validImageUrl) {
        try {
          const imageUrl = await handleScrapedImage(validImageUrl);
          cleanedRecipe.imageUrl = imageUrl ?? validImageUrl;
        } catch (imageError) {
          console.warn("Failed to process recipe image:", imageError);
        }
      } else {
        cleanedRecipe.imageUrl = undefined; // or set to a default placeholder
      }
    }

    if (cleanedRecipe) {
      cleanedRecipe.sourceUrl = url;
    }

    return { success: true, data: cleanedRecipe };
  } catch (error) {
    console.error("Error scraping recipe:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to scrape recipe",
    };
  }
}

export async function generateAiRecipe(prompt: string) {
  try {
    const completion = await generateAiRecipeCaller(prompt);
    return { success: true, data: completion };
  } catch (error) {
    console.error("Error generating AI recipe:", error);
    return {
      success: false,
      error:
        "Failed to generate AI recipe. Please check the URL and try again.",
    };
  }
}

// Helper function to handle image upload for scraped recipes
async function handleScrapedImage(imageUrl?: string) {
  console.log("Uploading image", imageUrl);
  if (imageUrl) {
    try {
      const imageId = await uploadImageFromUrl(imageUrl);
      return getImageUrl(imageId);
    } catch (error) {
      console.error("Error uploading image from URL:", error);
    }
  }
  return imageUrl;
}

export async function uploadRecipeImageFromUrl(imageUrl: string) {
  try {
    const imageId = await uploadImageFromUrl(imageUrl);
    return { success: true, imageUrl: getImageUrl(imageId) };
  } catch (error) {
    console.error("Error uploading image from URL:", error);
    return { success: false, error: "Failed to upload image" };
  }
}

/*
 PINNED RECIPES FUNCTIONS
*/

// Base function to toggle pin recipe with error handling.
async function togglePinRecipeBase(userId: string, recipeId: string) {
  try {
    const existingPin = await prisma.pinnedRecipe.findUnique({
      where: {
        userId_recipeId: {
          userId: userId,
          recipeId: recipeId,
        },
      },
    });

    if (existingPin) {
      await prisma.pinnedRecipe.delete({
        where: {
          id: existingPin.id,
        },
      });
      return { pinned: false };
    } else {
      await prisma.pinnedRecipe.create({
        data: {
          userId: userId,
          recipeId: recipeId,
        },
      });
      return { pinned: true };
    }
  } catch (error) {
    console.error("Error toggling pin recipe:", error);
    return { pinned: false };
  }
}

// Server action for authenticated users
export async function togglePinRecipeAction(recipeId: string) {
  const user = await getUser();
  if (!user) return redirectToLogin();
  if (!user.id) throw new Error("User ID is required to pin a recipe");

  return togglePinRecipeBase(user.id, recipeId);
}

// API route handler for JWT authentication
export async function togglePinRecipeAPI(token: string, recipeId: string) {
  try {
    const userId = getUserIdFromJwt(token);
    if (!userId) {
      throw new Error("User ID is required to pin a recipe");
    }
    return togglePinRecipeBase(userId, recipeId);
  } catch (error) {
    console.error("Error toggling pin recipe:", error);
    return { pinned: false };
  }
}

// Base function to get pinned recipes with error handling
async function getPinnedRecipesBase(userId: string | null) {
  if (!userId) {
    return [];
  }

  try {
    const pinnedRecipes = await prisma.pinnedRecipe.findMany({
      where: {
        userId: userId,
      },
      include: {
        recipe: true,
      },
      orderBy: {
        pinnedAt: "desc",
      },
    });

    return pinnedRecipes.map((pr) => pr.recipe);
  } catch (error) {
    console.error("Error getting pinned recipes:", error);
    return [];
  }
}

// Server action for authenticated users
export async function getPinnedRecipesAction() {
  const user = await getUser();
  return getPinnedRecipesBase(user?.id ?? null);
}

// API route handler for JWT authentication
export async function getPinnedRecipesAPI(token: string) {
  try {
    const userId = getUserIdFromJwt(token);
    if (!userId) {
      throw new Error("User ID is required to get pinned recipes");
    }
    return getPinnedRecipesBase(userId);
  } catch (error) {
    console.error("Error getting pinned recipes:", error);
    return [];
  }
}

/*
 FAVORITES FUNCTIONS
*/

export async function toggleFavoriteRecipe(recipeId: string) {
  try {
    const user = await getUser();

    if (!user) return redirectToLogin();

    const existingFavorite = await prisma.favoriteRecipe.findUnique({
      where: {
        userId_recipeId: {
          userId: user.id!,
          recipeId: recipeId,
        },
      },
    });

    if (existingFavorite) {
      await prisma.favoriteRecipe.delete({
        where: {
          id: existingFavorite.id,
        },
      });
      return { favorited: false };
    } else {
      if (!user.id) {
        throw new Error("User ID is required to favorite a recipe");
      }

      await prisma.favoriteRecipe.create({
        data: {
          userId: user.id,
          recipeId: recipeId,
        },
      });
      return { favorited: true };
    }
  } catch (error) {
    console.error("Error toggling favorite recipe:", error);
    throw new Error("Failed to toggle favorite recipe");
  }
}

export async function getFavoriteRecipes() {
  try {
    const user = await getUser();

    if (!user) return [];

    const favoriteRecipes = await prisma.favoriteRecipe.findMany({
      where: {
        userId: user.id,
      },
      include: {
        recipe: true,
      },
    });

    return favoriteRecipes.map((fr) => fr.recipe);
  } catch (error) {
    console.error("Error getting favorite recipes:", error);
    throw new Error("Failed to get favorite recipes");
  }
}

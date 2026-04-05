"use server";

import { getUser } from "@/lib/actions/auth-actions";
import {
  processUserMessage,
  OrchestratorResponse,
} from "../lib/ai-orchestrator";
import { ChatMessage } from "../stores/recipe-chat-store";
import { createRecipe } from "@/lib/actions/recipe-actions";
import { Recipe } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { generateAIImage } from "../lib/image-generator";
import { uploadImageFromUrl } from "@/lib/image-upload/cloudflare-images";
import prisma from "@/lib/prisma-client";

export async function sendChatMessage(
  message: string,
  chatHistory: ChatMessage[]
) {
  try {
    const user = await getUser();
    console.log("user", user);
    if (!user) {
      return {
        success: false,
        error: "Please sign in to use the AI assistant",
      };
    }

    // Check if there's already a recipe in the chat
    const hasExistingRecipe = chatHistory.some(
      (msg) => msg.type === "recipe" && msg.recipeData
    );

    const response = await processUserMessage(
      message,
      chatHistory,
      hasExistingRecipe
    );

    return { success: true, data: response };
  } catch (error) {
    console.error("Chat message error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to process message",
    };
  }
}

export async function saveRecipeFromChat(
  recipe: Omit<Recipe, "id" | "userId" | "createdAt" | "updatedAt">
) {
  try {
    const user = await getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Clean up the recipe object to only include fields that Prisma expects
    const cleanRecipe = {
      title: recipe.title,
      description: recipe.description,
      difficulty: recipe.difficulty,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      restTime: recipe.restTime,
      totalTime: recipe.totalTime,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      equipment: recipe.equipment,
      utensils: recipe.utensils,
      nutrition: recipe.nutrition,
      notes: recipe.notes,
      cuisineType: recipe.cuisineType,
      mealType: recipe.mealType,
      dietaryRestrictions: recipe.dietaryRestrictions,
      tags: recipe.tags,
      sourceUrl: recipe.sourceUrl,
      imageUrl: recipe.imageUrl,
      seasonality: recipe.seasonality,
      source: recipe.source,
      isDeleted: recipe.isDeleted,
      isPublic: recipe.isPublic,
      rating: recipe.rating,
      favoriteCount: recipe.favoriteCount,
      reviewCount: recipe.reviewCount,
      parsedIngredients: recipe.parsedIngredients,
      parsedInstructions: recipe.parsedInstructions,
    };

    // Save recipe without image first, without AI parsing
    const savedRecipe = await createRecipe(cleanRecipe as any, user.id || null, false);

    // Trigger background image generation (non-blocking)
    generateAndSaveRecipeImage(savedRecipe.id, recipe.title).catch((error) => {
      console.error("Background image generation failed:", error);
    });

    revalidatePath("/recipes");
    return savedRecipe;
  } catch (error) {
    console.error("Save recipe error:", error);
    throw error;
  }
}

// Background process for image generation
async function generateAndSaveRecipeImage(recipeId: string, title: string) {
  try {
    console.log(`[Background] Starting image generation for recipe ${recipeId}: ${title}`);
    
    // 1. Generate image using AI (returns Cloudflare ID or URL)
    const result = await generateAIImage(title);
    
    let cloudflareId: string;
    
    // Check if result is already a Cloudflare ID or needs upload
    if (result.startsWith('http://') || result.startsWith('https://')) {
      // Standard DALL-E API returned a URL, need to upload
      console.log(`[Background] Uploading DALL-E image to Cloudflare...`);
      cloudflareId = await uploadImageFromUrl(result);
    } else {
      // New API already uploaded to Cloudflare
      cloudflareId = result;
      console.log(`[Background] Image already uploaded to Cloudflare: ${cloudflareId}`);
    }

    // 2. Update recipe with Cloudflare image ID
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { imageUrl: cloudflareId },
    });

    console.log(
      `[Background] Successfully generated and saved image for recipe ${recipeId}. Cloudflare ID: ${cloudflareId}`
    );
  } catch (error) {
    console.error(`[Background] Failed to generate recipe image for ${recipeId}:`, error);
    // Fail silently - recipe already saved
  }
}

import { NextRequest, NextResponse } from "next/server";
import { processUserMessage } from "@/features/recipe-chat/lib/ai-orchestrator";
import { ChatMessage } from "@/features/recipe-chat/stores/recipe-chat-store";
import { getUserIdFromJwt } from "@/lib/helpers/get-user-id-from-jwt";
import { createRecipeAPI } from "@/lib/actions/recipe-actions";
import { generateAIImage } from "@/features/recipe-chat/lib/image-generator";
import { uploadImageFromUrl } from "@/lib/image-upload/cloudflare-images";
import prisma from "@/lib/prisma-client";
import { revalidatePath } from "next/cache";

// Helper function for background image generation
async function generateAndSaveRecipeImage(recipeId: string, title: string) {
  try {
    const imageUrl = await generateAIImage(title);
    const uploadedUrl = await uploadImageFromUrl(imageUrl);
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { imageUrl: uploadedUrl },
    });
    console.log(
      `Successfully generated and saved image for recipe ${recipeId}`
    );
  } catch (error) {
    console.error("Failed to generate recipe image:", error);
  }
}

interface ChatRequest {
  message: string;
  chatHistory: ChatMessage[];
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = getUserIdFromJwt(token);
    // const userId = "clzefyp8z0000gdusw0ii4med";
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { message, chatHistory }: ChatRequest = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    if (!Array.isArray(chatHistory)) {
      return NextResponse.json(
        { error: "Chat history must be an array" },
        { status: 400 }
      );
    }

    // Check if there's already a recipe in the chat
    const hasExistingRecipe = chatHistory.some(
      (msg) => msg.type === "recipe" && msg.recipeData
    );

    // Process the message through the AI orchestrator
    const response = await processUserMessage(
      message,
      chatHistory,
      hasExistingRecipe
    );

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Recipe chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

// Endpoint to save a recipe from the chat
export async function PUT(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = getUserIdFromJwt(token);
    // const userId = "clzefyp8z0000gdusw0ii4med";
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { recipe } = await req.json();

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe data is required" },
        { status: 400 }
      );
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
      dietaryRestrictions: recipe.dietaryRestrictions || [],
      tags: recipe.tags || [],
      sourceUrl: recipe.sourceUrl,
      imageUrl: recipe.imageUrl,
      seasonality: recipe.seasonality,
      source: recipe.source || "GEN_AI",
      isDeleted: false,
      isPublic: false,
      rating: null,
      favoriteCount: 0,
      reviewCount: 0,
    };

    // Save recipe without AI parsing since it's already parsed
    const savedRecipe = await createRecipeAPI(token, cleanRecipe as any, false);

    // Trigger background image generation (non-blocking)
    if (savedRecipe.id) {
      generateAndSaveRecipeImage(savedRecipe.id, recipe.title).catch(
        (error) => {
          console.error("Background image generation failed:", error);
        }
      );
    }

    revalidatePath("/recipes");

    return NextResponse.json({
      success: true,
      data: savedRecipe,
    });
  } catch (error) {
    console.error("Save recipe error:", error);
    return NextResponse.json(
      { error: "Failed to save recipe" },
      { status: 500 }
    );
  }
}

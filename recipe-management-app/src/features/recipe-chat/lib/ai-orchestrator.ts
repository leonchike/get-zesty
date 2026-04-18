import { Recipe, RecipeDifficulty } from "@prisma/client";
import { ChatMessage } from "../stores/recipe-chat-store";
import anthropic, { extractJson } from "@/lib/anthropic-client";

export type ResponseType = "conversation" | "recipe" | "recipe-modification";

export interface OrchestratorResponse {
  type: ResponseType;
  content: string;
  recipeData?: Recipe;
}

const SYSTEM_PROMPT = `
You are a helpful cooking assistant with these capabilities:

1. Recipe Generation: Create ONE recipe per chat session
2. Recipe Modifications:
   - Scale servings up or down
   - Substitute ingredients for dietary needs or preferences
   - Adjust cooking methods or techniques
   - Modify for different skill levels
   - Adapt for available equipment
3. Cooking Advice: Answer general cooking questions
4. Context Awareness: Remember the current recipe and all modifications

RULES:
- Only ONE recipe can be created per chat session
- Always return the COMPLETE updated recipe after modifications
- Maintain conversational tone while being helpful
- For recipes, return structured JSON matching this schema:
  {
    title: string,
    description: string,
    difficulty: "EASY" | "MEDIUM" | "HARD",
    prepTime: number (in minutes),
    cookTime: number (in minutes),
    restTime: number (in minutes, optional),
    totalTime: number (in minutes),
    servings: number,
    ingredients: string (formatted as multi-line text),
    instructions: string (formatted as numbered steps),
    equipment: string (optional),
    utensils: string (optional),
    notes: string (optional),
    cuisineType: string,
    mealType: string,
    dietaryRestrictions: string[],
    tags: string[]
  }

IMPORTANT: You must always respond with valid JSON only (no markdown fences).

When returning a recipe, respond with:
{
  "type": "recipe" or "recipe-modification",
  "content": "Your conversational message about the recipe",
  "recipe": { ...the complete recipe object... }
}

For non-recipe responses, return:
{
  "type": "conversation",
  "content": "Your response"
}
`;

export async function processUserMessage(
  message: string,
  chatHistory: ChatMessage[],
  hasExistingRecipe: boolean
): Promise<OrchestratorResponse> {
  try {
    // Check if user is asking for a new recipe when one exists
    if (hasExistingRecipe && isNewRecipeRequest(message)) {
      return {
        type: "conversation",
        content:
          "You already have a recipe in this session. To create a new recipe, please start a new chat session by closing and reopening the chat.",
      };
    }

    // Build messages array for Claude (user/assistant only, no system)
    const messages: { role: "user" | "assistant"; content: string }[] = [];

    for (const msg of chatHistory) {
      const content =
        msg.type === "recipe" && msg.recipeData
          ? `${msg.content}\n\nRecipe: ${JSON.stringify(msg.recipeData)}`
          : msg.content;

      const role = msg.role as "user" | "assistant";

      // Ensure alternating user/assistant messages (Claude requirement)
      if (messages.length > 0 && messages[messages.length - 1].role === role) {
        // Merge consecutive same-role messages
        messages[messages.length - 1].content += "\n\n" + content;
      } else {
        messages.push({ role, content });
      }
    }

    // Add the current user message
    if (messages.length > 0 && messages[messages.length - 1].role === "user") {
      messages[messages.length - 1].content += "\n\n" + message;
    } else {
      messages.push({ role: "user", content: message });
    }

    // Ensure first message is from user (Claude requirement)
    if (messages.length > 0 && messages[0].role !== "user") {
      messages.unshift({ role: "user", content: "Hello" });
    }

    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages,
    });

    const responseText =
      completion.content[0].type === "text" ? completion.content[0].text : "";
    if (!responseText) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(extractJson(responseText));

    // Validate and transform the response
    if (parsed.type === "recipe" || parsed.type === "recipe-modification") {
      if (!parsed.recipe) {
        throw new Error("Recipe data missing from response");
      }

      // Transform the recipe to match our schema
      const recipeData: Recipe = {
        id: "", // Will be set by database
        userId: "", // Will be set by server
        title: parsed.recipe.title || "Untitled Recipe",
        description: parsed.recipe.description || null,
        difficulty: validateDifficulty(parsed.recipe.difficulty),
        prepTime: parsed.recipe.prepTime || null,
        cookTime: parsed.recipe.cookTime || null,
        restTime: parsed.recipe.restTime || null,
        totalTime: parsed.recipe.totalTime || null,
        servings: parsed.recipe.servings || null,
        ingredients: parsed.recipe.ingredients || null,
        instructions: parsed.recipe.instructions || null,
        equipment: parsed.recipe.equipment || null,
        utensils: parsed.recipe.utensils || null,
        nutrition: null,
        notes: parsed.recipe.notes || null,
        cuisineType: parsed.recipe.cuisineType || null,
        mealType: parsed.recipe.mealType || null,
        dietaryRestrictions: parsed.recipe.dietaryRestrictions || [],
        tags: parsed.recipe.tags || [],
        sourceUrl: null,
        imageUrl: null,
        seasonality: null,
        parsedIngredients: null,
        parsedInstructions: null,
        source: "GEN_AI",
        isDeleted: false,
        isPublic: false,
        rating: null,
        favoriteCount: 0,
        reviewCount: 0,
        embeddingUpdatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        type: parsed.type,
        content: parsed.content || "Here's your recipe:",
        recipeData,
      };
    }

    return {
      type: "conversation",
      content: parsed.content || "I'm not sure how to respond to that.",
    };
  } catch (error) {
    console.error("AI orchestrator error:", error);
    throw new Error("Failed to process message");
  }
}

function isNewRecipeRequest(message: string): boolean {
  const newRecipeKeywords = [
    "new recipe",
    "another recipe",
    "different recipe",
    "create a recipe",
    "make a recipe",
    "give me a recipe",
    "suggest a recipe",
  ];

  const lowerMessage = message.toLowerCase();
  return newRecipeKeywords.some((keyword) => lowerMessage.includes(keyword));
}

function validateDifficulty(difficulty: string | undefined): RecipeDifficulty {
  const valid: RecipeDifficulty[] = ["EASY", "MEDIUM", "HARD"];
  const upper = difficulty?.toUpperCase() as RecipeDifficulty;
  return valid.includes(upper) ? upper : "EASY";
}

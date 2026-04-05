// src/lib/functions/recipe-parser.ts

import axios from "axios";
import * as cheerio from "cheerio";
import recipeDataScraper from "recipe-data-scraper";
import { RecipeSource } from "@prisma/client";

enum RecipeDifficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

interface Recipe {
  title: string;
  description: string | null;
  difficulty: RecipeDifficulty;
  prepTime: number | null;
  cookTime: number | null;
  restTime?: number | null;
  totalTime?: number | null;
  servings?: number | null;
  ingredients?: string | null;
  instructions?: string | null;
  utensils?: string | null;
  nutrition?: object | null;
  notes?: string | null;
  dietaryRestrictions?: string[];
  tags?: string[];
  sourceUrl: string | null;
  imageUrl: string | null;
  source: RecipeSource;
}

async function fetchHtml(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching HTML:", error);
    throw new Error("Failed to fetch recipe page");
  }
}

async function parseWithLibrary(url: string): Promise<Partial<Recipe>> {
  try {
    const recipe = await recipeDataScraper(url);

    console.log("recipe line 54", recipe);
    return {
      title: recipe?.name || "",
      description: recipe?.description || "",
      prepTime: parseDuration(recipe?.prepTime) || null,
      cookTime: parseDuration(recipe?.cookTime) || null,
      totalTime: parseDuration(recipe?.totalTime) || null,
      servings: parseServings(recipe?.recipeYield) || null,
      ingredients: recipe?.recipeIngredients?.join("\n") || null,
      instructions:
        parseInstructions(recipe?.recipeInstructions).join("\n\n") || null,
      tags:
        [...(recipe?.recipeCategories || []), ...(recipe?.keywords || [])] ||
        null,
      sourceUrl: url || null,
      imageUrl: recipe?.image || null,
    };
  } catch (error) {
    console.error("Error parsing with library:", error);
    return {};
  }
}

function parseDuration(duration: string | undefined): number | null {
  if (!duration) return null;
  const matches = duration.match(
    /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  );
  if (!matches) return null;
  const [, days, hours, minutes, seconds] = matches.map(Number);
  return (
    (days || 0) * 24 * 60 +
    (hours || 0) * 60 +
    (minutes || 0) +
    Math.round((seconds || 0) / 60)
  );
}

function parseServings(servings: string | undefined): number | null {
  if (!servings || typeof servings !== "string") return null;
  const match = servings.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function parseJsonLd($: cheerio.CheerioAPI): Recipe | null {
  const jsonLdScripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < jsonLdScripts.length; i++) {
    const jsonLdScript = $(jsonLdScripts[i]).html();
    if (!jsonLdScript) continue;

    try {
      const jsonLd = JSON.parse(jsonLdScript);
      const recipe = Array.isArray(jsonLd)
        ? jsonLd.find((item) => item["@type"] === "Recipe")
        : jsonLd["@type"] === "Recipe"
        ? jsonLd
        : null;

      if (recipe) {
        return {
          title: recipe.name,
          description: recipe.description,
          ingredients: Array.isArray(recipe.recipeIngredient)
            ? recipe.recipeIngredient
            : [],
          instructions: parseInstructions(recipe.recipeInstructions).join(
            "\n\n"
          ),
          prepTime: parseDuration(recipe.prepTime),
          cookTime: parseDuration(recipe.cookTime),
          totalTime: parseDuration(recipe.totalTime),
          servings: parseServings(recipe.recipeYield),
          imageUrl: Array.isArray(recipe.image)
            ? recipe.image[0]
            : recipe.image,
          sourceUrl: recipe.url,
          difficulty: RecipeDifficulty.EASY, // Default value
          restTime: null, // Default value
          utensils: null, // Default value
          nutrition: null, // Default value
          notes: null, // Default value
          dietaryRestrictions: [], // Default value
          tags: [], // Default value
          source: RecipeSource.SCRAPE,
        };
      }
    } catch (error) {
      console.error("Error parsing JSON-LD:", error);
    }
  }
  return null;
}

function parseMicrodata($: cheerio.CheerioAPI): Recipe | null {
  const title = $('[itemprop="name"]').first().text().trim();
  const description = $('[itemprop="description"]').first().text().trim();
  const ingredients = $(
    '[itemprop="recipeIngredient"], [itemprop="ingredients"]'
  )
    .map((_, el) => $(el).text().trim())
    .get();
  const instructions = $('[itemprop="recipeInstructions"]')
    .map((_, el) => $(el).text().trim())
    .get();
  const prepTime = parseDuration($('[itemprop="prepTime"]').attr("content"));
  const cookTime = parseDuration($('[itemprop="cookTime"]').attr("content"));
  const totalTime = parseDuration($('[itemprop="totalTime"]').attr("content"));
  const servings = parseServings(
    $('[itemprop="recipeYield"]').first().text().trim()
  );
  const imageUrl =
    $('[itemprop="image"]').attr("src") ||
    $('[itemprop="image"]').attr("content");
  const sourceUrl =
    $('[itemprop="url"]').attr("href") || $('[itemprop="url"]').attr("content");
  const cuisine = $('[itemprop="recipeCuisine"]').first().text().trim();
  const category = $('[itemprop="recipeCategory"]').first().text().trim();
  const author = $('[itemprop="author"]').first().text().trim();
  const yieldFromRecipe = $('[itemprop="recipeYield"]').first().text().trim();

  if (!title || ingredients.length === 0 || instructions.length === 0)
    return null;

  return {
    title,
    description,
    ingredients: ingredients.join("\n"),
    instructions: instructions.join("\n\n"),
    prepTime,
    cookTime,
    totalTime,
    servings,
    imageUrl: imageUrl || null,
    sourceUrl: sourceUrl || null,
    difficulty: RecipeDifficulty.EASY, // Default value
    restTime: null, // Default value
    utensils: null, // Default value
    nutrition: null, // Default value
    notes: null, // Default value
    dietaryRestrictions: [], // Default value
    tags: [], // Default value
    source: RecipeSource.SCRAPE,
  };
}

function parseHeuristics($: cheerio.CheerioAPI): Recipe | null {
  const title = $("h1").first().text().trim() || $("title").text().trim();
  const description = $('meta[name="description"]').attr("content") || "";

  const ingredientSelectors = [
    "ul li",
    ".ingredients li",
    '[class*="ingredient"] li',
  ];
  let ingredients: string[] = [];
  for (const selector of ingredientSelectors) {
    ingredients = $(selector)
      .filter((_, el) => {
        const text = $(el).text().trim();
        return (
          /^\d+/.test(text) || /cup|tablespoon|teaspoon|pound|ounce/i.test(text)
        );
      })
      .map((_, el) => $(el).text().trim())
      .get();
    if (ingredients.length > 0) break;
  }

  const instructionSelectors = [
    "ol li",
    ".instructions li",
    '[class*="instruction"] li',
    ".steps li",
  ];
  let instructions: string[] = [];
  for (const selector of instructionSelectors) {
    instructions = $(selector)
      .map((_, el) => $(el).text().trim())
      .get();
    if (instructions.length > 0) break;
  }

  const imageUrl =
    $('meta[property="og:image"]').attr("content") ||
    $('img[class*="hero"], img[class*="main"], img[class*="featured"]').attr(
      "src"
    );
  const sourceUrl = $('meta[property="og:url"]').attr("content") || "";

  if (!title || ingredients.length === 0 || instructions.length === 0)
    return null;

  return {
    title,
    description,
    ingredients: ingredients.join("\n"),
    instructions: instructions.join("\n\n"),
    difficulty: RecipeDifficulty.MEDIUM, // Default value, can be adjusted later
    prepTime: null, // We don't have this information from the parsing
    cookTime: null, // We don't have this information from the parsing
    imageUrl: imageUrl || null,
    sourceUrl,
    servings: parseServings(
      $('div:contains("Servings"), span:contains("Servings")').first().text()
    ),
    source: RecipeSource.SCRAPE,
  };
}

function parseInstructions(instructions: any): string[] {
  if (Array.isArray(instructions)) {
    return instructions
      .map((instruction) => {
        if (typeof instruction === "string") return instruction;
        if (instruction?.["@type"] === "HowToStep") return instruction.text;
        return "";
      })
      .filter(Boolean);
  }
  if (typeof instructions === "string") {
    return instructions.split(/\r?\n/).filter((line) => line.trim() !== "");
  }
  return [];
}

function cleanRecipeText(text: string): string {
  // Remove checkboxes (▢ or similar characters)
  text = text.replace(/▢/g, "");

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, "");

  // Remove extra whitespace, but preserve newlines
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  return text;
}

export async function parseRecipe(url: string): Promise<Recipe> {
  const cleanUrl = url.trim();

  // First, try parsing with the library
  let recipe = await parseWithLibrary(cleanUrl);

  console.log("recipe", recipe);

  // If the library fails to parse completely, use our custom parsing
  if (!recipe || Object.keys(recipe).length === 0) {
    const html = await fetchHtml(cleanUrl);
    const $ = cheerio.load(html);

    const jsonLdRecipe = parseJsonLd($);
    const microdataRecipe = parseMicrodata($);
    const heuristicRecipe = parseHeuristics($);

    // Combine the results, prioritizing jsonLd, then microdata, then heuristics
    recipe = {
      ...heuristicRecipe,
      ...microdataRecipe,
      ...jsonLdRecipe,
    };
  }

  // Transform and fill in the recipe object to match the database schema
  const fullRecipe: Recipe = {
    title: recipe.title || "Untitled Recipe",
    description: recipe.description
      ? cleanRecipeText(recipe.description)
      : null,
    difficulty: recipe.difficulty || RecipeDifficulty.EASY,
    prepTime: recipe.prepTime || null,
    cookTime: recipe.cookTime || null,
    restTime: recipe.restTime || null,
    totalTime: recipe.totalTime || undefined,
    servings: recipe.servings || 4,
    ingredients: recipe.ingredients
      ? cleanRecipeText(recipe.ingredients)
      : undefined,
    instructions: recipe.instructions
      ? cleanRecipeText(recipe.instructions)
      : undefined,
    utensils: recipe.utensils ? cleanRecipeText(recipe.utensils) : undefined,
    nutrition: recipe.nutrition || undefined,
    notes: recipe.notes ? cleanRecipeText(recipe.notes) : undefined,
    dietaryRestrictions: recipe.dietaryRestrictions || [],
    tags: recipe.tags || [],
    sourceUrl: recipe.sourceUrl || cleanUrl,
    imageUrl: recipe.imageUrl || null,
    source: RecipeSource.SCRAPE,
  };

  // If we have additional data from other parsing methods, add it without replacing existing data
  if (Object.keys(recipe).length === 0) {
    const html = await fetchHtml(cleanUrl);
    const $ = cheerio.load(html);

    const jsonLdRecipe = parseJsonLd($);
    const microdataRecipe = parseMicrodata($);
    const heuristicRecipe = parseHeuristics($);

    // Function to merge additional data without overwriting existing data
    const mergeAdditionalData = (source: Partial<Recipe>) => {
      Object.keys(source).forEach((key) => {
        if (
          fullRecipe[key as keyof Recipe] === undefined ||
          fullRecipe[key as keyof Recipe] === null
        ) {
          (fullRecipe[key as keyof Recipe] as any) =
            source[key as keyof Recipe];
        }
      });
    };

    // Merge additional data, prioritizing jsonLd, then microdata, then heuristics
    mergeAdditionalData(heuristicRecipe || {});
    mergeAdditionalData(microdataRecipe || {});
    mergeAdditionalData(jsonLdRecipe || {});
  }

  return fullRecipe;
}

// // src/lib/functions/recipe-parser.ts

import axios from "axios";
import * as cheerio from "cheerio";
import recipeDataScraper from "recipe-data-scraper";

interface ParsedRecipe {
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  servings?: number;
  imageUrl?: string;
  sourceUrl: string;
  cuisine?: string;
  category?: string;
  author?: string;
  yield?: string;
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

function parseJsonLd($: cheerio.CheerioAPI): ParsedRecipe | null {
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
          instructions: parseInstructions(recipe.recipeInstructions),
          prepTime: parseDuration(recipe.prepTime),
          cookTime: parseDuration(recipe.cookTime),
          totalTime: parseDuration(recipe.totalTime),
          servings: parseServings(recipe.recipeYield),
          imageUrl: Array.isArray(recipe.image)
            ? recipe.image[0]
            : recipe.image,
          sourceUrl: recipe.url,
          cuisine: recipe.recipeCuisine,
          category: recipe.recipeCategory,
          author: recipe.author?.name,
          yield: recipe.recipeYield,
        };
      }
    } catch (error) {
      console.error("Error parsing JSON-LD:", error);
    }
  }
  return null;
}

function parseMicrodata($: cheerio.CheerioAPI): ParsedRecipe | null {
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
    ingredients,
    instructions,
    prepTime,
    cookTime,
    totalTime,
    servings,
    imageUrl,
    sourceUrl: sourceUrl || "",
    cuisine,
    category,
    author,
    yield: yieldFromRecipe,
  };
}

function parseHeuristics($: cheerio.CheerioAPI): ParsedRecipe | null {
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
    ingredients,
    instructions,
    imageUrl,
    sourceUrl,
    servings: parseServings(
      $('div:contains("Servings"), span:contains("Servings")').first().text()
    ),
  };
}

function parseInstructions(instructions: any): string[] {
  if (Array.isArray(instructions)) {
    return instructions
      .map((instruction) => {
        if (typeof instruction === "string") return instruction;
        if (instruction["@type"] === "HowToStep") return instruction.text;
        return "";
      })
      .filter(Boolean);
  }
  if (typeof instructions === "string") {
    return instructions.split(/\r?\n/).filter((line) => line.trim() !== "");
  }
  return [];
}

function parseDuration(duration: string | undefined): number | undefined {
  if (!duration) return undefined;
  const matches = duration.match(
    /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  );
  if (!matches) return undefined;
  const [, days, hours, minutes, seconds] = matches.map(Number);
  return (
    (days || 0) * 24 * 60 +
    (hours || 0) * 60 +
    (minutes || 0) +
    (seconds || 0) / 60
  );
}

function parseServings(servings: string | undefined): number | undefined {
  if (!servings) return undefined;
  const match = servings.match(/\d+/);
  return match ? parseInt(match[0], 10) : undefined;
}

export async function parseRecipe(url: string): Promise<ParsedRecipe> {
  const cleanUrl = url.trim();
  const html = await fetchHtml(cleanUrl);
  const $ = cheerio.load(html);

  const jsonLdRecipe = parseJsonLd($);
  if (jsonLdRecipe) return { ...jsonLdRecipe, sourceUrl: cleanUrl };

  const microdataRecipe = parseMicrodata($);
  if (microdataRecipe) return { ...microdataRecipe, sourceUrl: cleanUrl };

  const heuristicRecipe = parseHeuristics($);
  if (heuristicRecipe) return { ...heuristicRecipe, sourceUrl: cleanUrl };

  throw new Error("Unable to parse recipe from the provided URL");
}

// scripts/test-scraper.ts

import { parseRecipe } from "../src/lib/functions/recipe-parser";

async function testScraper(url: string) {
  try {
    console.log(`Testing scraper with URL: ${url}`);
    const recipe = await parseRecipe(url);
    console.log("Parsed Recipe:");
    console.log(JSON.stringify(recipe, null, 2));
  } catch (error) {
    console.error("Error parsing recipe:", error);
  }
}

// Check if a URL is provided as a command-line argument
const url = process.argv[2];
if (!url) {
  console.error("Please provide a URL as a command-line argument");
  process.exit(1);
}

testScraper(url);

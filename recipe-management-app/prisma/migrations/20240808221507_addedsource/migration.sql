-- CreateEnum
CREATE TYPE "RecipeSource" AS ENUM ('USER', 'SCRAPE', 'GEN_AI');

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "source" "RecipeSource";

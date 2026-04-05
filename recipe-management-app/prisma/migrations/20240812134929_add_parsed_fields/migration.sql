-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "parsedIngredients" JSONB,
ADD COLUMN     "parsedInstructions" JSONB;

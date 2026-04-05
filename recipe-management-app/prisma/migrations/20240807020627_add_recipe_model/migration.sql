-- CreateEnum
CREATE TYPE "RecipeDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" "RecipeDifficulty" NOT NULL DEFAULT 'EASY',
    "prepTime" INTEGER,
    "cookTime" INTEGER,
    "restTime" INTEGER,
    "totalTime" INTEGER,
    "servings" INTEGER,
    "ingredients" TEXT,
    "instructions" TEXT,
    "utensils" TEXT,
    "nutrition" JSONB,
    "notes" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "cuisineType" TEXT,
    "mealType" TEXT,
    "dietaryRestrictions" TEXT[],
    "tags" TEXT[],
    "sourceUrl" TEXT,
    "imageUrl" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "seasonality" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

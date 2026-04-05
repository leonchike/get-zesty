-- CreateTable
CREATE TABLE "Cookbook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "publisher" TEXT,
    "year" INTEGER,
    "isbn" TEXT,
    "coverUrl" TEXT,
    "description" TEXT,
    "totalPages" INTEGER,
    "fileType" TEXT,
    "filePath" TEXT,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "recipeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cookbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookbookRecipe" (
    "id" TEXT NOT NULL,
    "cookbookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ingredients" TEXT,
    "instructions" TEXT,
    "pageNumber" INTEGER,
    "cuisineType" TEXT,
    "mealType" TEXT,
    "servings" TEXT,
    "prepTime" TEXT,
    "cookTime" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CookbookRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeChunk" (
    "id" TEXT NOT NULL,
    "cookbookRecipeId" TEXT NOT NULL,
    "chunkType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cookbook_userId_idx" ON "Cookbook"("userId");

-- CreateIndex
CREATE INDEX "CookbookRecipe_userId_idx" ON "CookbookRecipe"("userId");

-- CreateIndex
CREATE INDEX "CookbookRecipe_cookbookId_idx" ON "CookbookRecipe"("cookbookId");

-- CreateIndex
CREATE INDEX "RecipeChunk_cookbookRecipeId_idx" ON "RecipeChunk"("cookbookRecipeId");

-- AddForeignKey
ALTER TABLE "Cookbook" ADD CONSTRAINT "Cookbook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookbookRecipe" ADD CONSTRAINT "CookbookRecipe_cookbookId_fkey" FOREIGN KEY ("cookbookId") REFERENCES "Cookbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookbookRecipe" ADD CONSTRAINT "CookbookRecipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeChunk" ADD CONSTRAINT "RecipeChunk_cookbookRecipeId_fkey" FOREIGN KEY ("cookbookRecipeId") REFERENCES "CookbookRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "GroceryItem" ADD COLUMN     "cookbookRecipeId" TEXT;

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "cookbookRecipeId" TEXT;

-- AddForeignKey
ALTER TABLE "GroceryItem" ADD CONSTRAINT "GroceryItem_cookbookRecipeId_fkey" FOREIGN KEY ("cookbookRecipeId") REFERENCES "CookbookRecipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_cookbookRecipeId_fkey" FOREIGN KEY ("cookbookRecipeId") REFERENCES "CookbookRecipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

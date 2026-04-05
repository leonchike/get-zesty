-- CreateEnum
CREATE TYPE "GroceryItemStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DELETED');

-- CreateTable
CREATE TABLE "GroceryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER,
    "userId" TEXT NOT NULL,
    "sectionId" TEXT,
    "commonItemId" TEXT,
    "status" "GroceryItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrocerySection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "GrocerySection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommonGroceryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "CommonGroceryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroceryItem_status_idx" ON "GroceryItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GrocerySection_name_key" ON "GrocerySection"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CommonGroceryItem_name_key" ON "CommonGroceryItem"("name");

-- AddForeignKey
ALTER TABLE "GroceryItem" ADD CONSTRAINT "GroceryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryItem" ADD CONSTRAINT "GroceryItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "GrocerySection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryItem" ADD CONSTRAINT "GroceryItem_commonItemId_fkey" FOREIGN KEY ("commonItemId") REFERENCES "CommonGroceryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommonGroceryItem" ADD CONSTRAINT "CommonGroceryItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "GrocerySection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

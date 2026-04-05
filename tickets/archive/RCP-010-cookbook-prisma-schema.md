# RCP-010: Cookbook Database Schema

**Status:** `[ ]` Not started
**Phase:** 4 — Cookbook Database
**Priority:** P0
**Depends on:** None (can start independently)

## Summary

Add Prisma models for the cookbook library feature and create the pgvector migration for embedding-based search.

## Files to Modify

- `recipe-management-app/prisma/schema.prisma`

## New Models

### Cookbook
```prisma
model Cookbook {
  id          String           @id @default(cuid())
  userId      String
  title       String
  author      String?
  publisher   String?
  year        Int?
  isbn        String?
  coverUrl    String?
  description String?
  totalPages  Int?
  fileType    String?          // "pdf", "epub"
  filePath    String?          // Cloud storage path
  isProcessed Boolean          @default(false)
  recipeCount Int              @default(0)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipes     CookbookRecipe[]

  @@index([userId])
}
```

### CookbookRecipe
```prisma
model CookbookRecipe {
  id           String         @id @default(cuid())
  cookbookId   String
  userId       String
  title        String
  description  String?
  ingredients  String?
  instructions String?
  pageNumber   Int?
  cuisineType  String?
  mealType     String?
  servings     Int?
  prepTime     Int?
  cookTime     Int?
  imageUrl     String?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  cookbook      Cookbook        @relation(fields: [cookbookId], references: [id], onDelete: Cascade)
  user         User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  chunks       RecipeChunk[]

  @@index([cookbookId])
  @@index([userId])
  @@index([title])
}
```

### RecipeChunk
```prisma
model RecipeChunk {
  id               String         @id @default(cuid())
  cookbookRecipeId  String
  chunkType        String         // "full", "ingredients", "instructions", "description"
  content          String
  createdAt        DateTime       @default(now())
  cookbookRecipe   CookbookRecipe @relation(fields: [cookbookRecipeId], references: [id], onDelete: Cascade)

  @@index([cookbookRecipeId])
}
```

### User Model Additions
```prisma
cookbooks       Cookbook[]
cookbookRecipes CookbookRecipe[]
```

## Post-Migration Raw SQL

```sql
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "RecipeChunk" ADD COLUMN embedding vector(1536);
CREATE INDEX ON "RecipeChunk" USING hnsw (embedding vector_cosine_ops);
CREATE INDEX cookbook_recipe_search_idx ON "CookbookRecipe"
  USING GIN (to_tsvector('english',
    coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(ingredients,'')));
```

## Acceptance Criteria

- [ ] `npx prisma migrate dev` succeeds
- [ ] pgvector extension enabled on Supabase
- [ ] Vector column and HNSW index created
- [ ] Full-text search index created on CookbookRecipe
- [ ] User model relations work correctly
- [ ] Prisma Studio shows new tables

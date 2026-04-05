-- Run this AFTER `npx prisma migrate dev` creates the Cookbook/CookbookRecipe/RecipeChunk tables
-- This adds pgvector support for RAG/semantic search

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector embedding column to RecipeChunk (1536 dimensions for text-embedding-3-small)
ALTER TABLE "RecipeChunk" ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- HNSW index for fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS recipe_chunk_embedding_idx
  ON "RecipeChunk" USING hnsw (embedding vector_cosine_ops);

-- Full-text search index on CookbookRecipe for hybrid search
CREATE INDEX IF NOT EXISTS cookbook_recipe_search_idx
  ON "CookbookRecipe"
  USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(ingredients,'')));

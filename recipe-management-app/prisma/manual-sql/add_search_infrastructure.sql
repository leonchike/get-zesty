-- Hybrid search infrastructure.
-- Apply AFTER `npx prisma migrate dev` so the Job table and Prisma `Unsupported(...)` columns exist.
-- Idempotent: safe to re-run.

-- ─────────────────────────── Extensions ───────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS vector;

-- `unaccent()` is STABLE by default, which blocks its use in a GENERATED column.
-- Wrap it in an IMMUTABLE SQL function so we can call it from the generated tsvector.
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$ SELECT unaccent('unaccent'::regdictionary, $1) $$;

-- ─────────────────────────── Recipe ───────────────────────────
-- Drop existing generated column if re-running (generated columns can't be altered in place)
ALTER TABLE "Recipe" DROP COLUMN IF EXISTS "searchVector";

ALTER TABLE "Recipe" ADD COLUMN "searchVector" tsvector
GENERATED ALWAYS AS (
    setweight(to_tsvector('english', immutable_unaccent(coalesce(title, ''))),          'A') ||
    setweight(to_tsvector('english', immutable_unaccent(
        coalesce("cuisineType", '') || ' ' || coalesce("mealType", '')
    )),                                                                                  'B') ||
    setweight(to_tsvector('english', immutable_unaccent(coalesce(description, ''))),    'C') ||
    setweight(to_tsvector('english', immutable_unaccent(coalesce(ingredients, ''))),    'D')
) STORED;

CREATE INDEX IF NOT EXISTS recipe_search_vector_idx
    ON "Recipe" USING GIN ("searchVector");

-- Trigram indexes for typo-tolerant fuzzy matching
CREATE INDEX IF NOT EXISTS recipe_title_trgm_idx
    ON "Recipe" USING GIN (title gin_trgm_ops);

-- Embedding column (Prisma declares it as Unsupported; this ensures it exists at the DB level)
ALTER TABLE "Recipe" ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE "Recipe" ADD COLUMN IF NOT EXISTS "embeddingUpdatedAt" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS recipe_embedding_hnsw_idx
    ON "Recipe" USING hnsw (embedding vector_cosine_ops);

-- ─────────────────────── CookbookRecipe ───────────────────────
-- Replace the old unweighted GIN index with a weighted, stored tsvector.
DROP INDEX IF EXISTS cookbook_recipe_search_idx;

ALTER TABLE "CookbookRecipe" DROP COLUMN IF EXISTS "searchVector";

ALTER TABLE "CookbookRecipe" ADD COLUMN "searchVector" tsvector
GENERATED ALWAYS AS (
    setweight(to_tsvector('english', immutable_unaccent(coalesce(title, ''))),          'A') ||
    setweight(to_tsvector('english', immutable_unaccent(
        coalesce("cuisineType", '') || ' ' || coalesce("mealType", '')
    )),                                                                                  'B') ||
    setweight(to_tsvector('english', immutable_unaccent(coalesce(description, ''))),    'C') ||
    setweight(to_tsvector('english', immutable_unaccent(coalesce(ingredients, ''))),    'D')
) STORED;

CREATE INDEX IF NOT EXISTS cookbook_recipe_search_vector_idx
    ON "CookbookRecipe" USING GIN ("searchVector");

CREATE INDEX IF NOT EXISTS cookbook_recipe_title_trgm_idx
    ON "CookbookRecipe" USING GIN (title gin_trgm_ops);

-- ─────────────────────────── Job queue ───────────────────────────
-- Pickup index: worker's hot query filters by state + runAfter.
CREATE INDEX IF NOT EXISTS job_pickup_idx
    ON "Job" (state, "runAfter")
    WHERE state = 'pending';

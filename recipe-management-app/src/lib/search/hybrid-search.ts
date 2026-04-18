/**
 * Hybrid search: full-text (tsvector+GIN) + trigram fuzzy (pg_trgm) +
 * semantic (pgvector/HNSW), fused via Reciprocal Rank Fusion, then
 * re-ranked with per-user engagement signals.
 *
 * Fixes the "fish taco" → "The Fish Shop's Mahi Mahi Tacos" problem that
 * plain ILIKE substring search can't solve:
 *   - tokenization splits "fish taco" into [fish, taco]
 *   - stemming maps "tacos" → "taco"
 *   - vector search pulls "mahi mahi" in via embedding proximity to "fish"
 */

import prisma from "@/lib/prisma-client";
import { getCachedQueryEmbedding } from "./embedding-cache";
import { buildWebsearchQuery, isQueryActionable, tokenize } from "./query";

// ─────────────────────────── Types ───────────────────────────

export interface HybridRecipeResult {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  ingredients: string | null;
  cuisineType: string | null;
  mealType: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  favoriteCount: number;
  isFavorite: boolean;
  isPinned: boolean;
  finalScore: number;
  titleHighlight: string;
}

export interface HybridCookbookResult {
  id: string;
  cookbookId: string;
  title: string;
  description: string | null;
  cuisineType: string | null;
  imageUrl: string | null;
  cookbookTitle: string;
  cookbookAuthor: string | null;
  cookbookCoverUrl: string | null;
  finalScore: number;
  titleHighlight: string;
}

export interface HybridSearchFilters {
  cuisineTypes?: string[];
  mealTypes?: string[];
  isFavorite?: boolean;
  isPinned?: boolean;
  includePublic?: boolean;
}

// ─────────────────────────── Recipe search ───────────────────────────

export async function searchRecipes(
  userId: string | null,
  rawQuery: string,
  opts: { limit?: number; filters?: HybridSearchFilters } = {}
): Promise<HybridRecipeResult[]> {
  if (!isQueryActionable(rawQuery)) return [];

  const limit = opts.limit ?? 20;
  const filters = opts.filters ?? {};
  const tsQuery = buildWebsearchQuery(rawQuery);
  const trgmQuery = rawQuery.trim().toLowerCase();

  // Embedding is optional — if OpenAI is down or the key is missing,
  // the lexical + fuzzy paths still return results.
  let embeddingLiteral: string | null = null;
  try {
    const embedding = await getCachedQueryEmbedding(rawQuery);
    embeddingLiteral = `[${embedding.join(",")}]`;
  } catch (err) {
    console.warn("[hybrid-search] embedding failed, falling back to lexical+fuzzy only", err);
  }

  const cuisineFilter = filters.cuisineTypes?.length
    ? filters.cuisineTypes
    : null;
  const mealFilter = filters.mealTypes?.length ? filters.mealTypes : null;

  // Visibility scope: user's own + optionally public
  const userVisibilitySQL = userId
    ? filters.includePublic === false
      ? `r."userId" = $userId`
      : `(r."userId" = $userId OR r."isPublic" = true)`
    : `r."isPublic" = true`;

  // The vector CTE must run even if the embedding is null, but we
  // short-circuit it with an always-false predicate in that case.
  const vectorPredicate = embeddingLiteral
    ? `r.embedding IS NOT NULL`
    : `FALSE`;

  const vectorOrderBy = embeddingLiteral
    ? `r.embedding <=> '${embeddingLiteral}'::vector`
    : `r.id`;

  const vectorScore = embeddingLiteral
    ? `1 - (r.embedding <=> '${embeddingLiteral}'::vector)`
    : `0`;

  const sql = `
    WITH fts AS (
      SELECT r.id,
             ts_rank_cd(r."searchVector", websearch_to_tsquery('english', $query)) AS score,
             row_number() OVER (
               ORDER BY ts_rank_cd(r."searchVector", websearch_to_tsquery('english', $query)) DESC
             ) AS rank
      FROM "Recipe" r
      WHERE r."isDeleted" = false
        AND ${userVisibilitySQL}
        AND r."searchVector" @@ websearch_to_tsquery('english', $query)
        ${cuisineFilter ? `AND r."cuisineType" = ANY($cuisineFilter)` : ""}
        ${mealFilter ? `AND r."mealType" = ANY($mealFilter)` : ""}
      LIMIT 100
    ),
    trgm AS (
      SELECT r.id,
             similarity(r.title, $trgm) AS score,
             row_number() OVER (ORDER BY similarity(r.title, $trgm) DESC) AS rank
      FROM "Recipe" r
      WHERE r."isDeleted" = false
        AND ${userVisibilitySQL}
        AND r.title % $trgm
        ${cuisineFilter ? `AND r."cuisineType" = ANY($cuisineFilter)` : ""}
        ${mealFilter ? `AND r."mealType" = ANY($mealFilter)` : ""}
      LIMIT 50
    ),
    vec AS (
      SELECT r.id,
             ${vectorScore} AS score,
             row_number() OVER (ORDER BY ${vectorOrderBy}) AS rank
      FROM "Recipe" r
      WHERE r."isDeleted" = false
        AND ${userVisibilitySQL}
        AND ${vectorPredicate}
        ${cuisineFilter ? `AND r."cuisineType" = ANY($cuisineFilter)` : ""}
        ${mealFilter ? `AND r."mealType" = ANY($mealFilter)` : ""}
      ORDER BY ${vectorOrderBy}
      LIMIT 50
    ),
    fused AS (
      SELECT id, SUM(1.0 / (60 + rank)) AS rrf_score
      FROM (
        SELECT id, rank FROM fts
        UNION ALL
        SELECT id, rank FROM trgm
        UNION ALL
        SELECT id, rank FROM vec
      ) u
      GROUP BY id
    ),
    joined AS (
      SELECT r.*,
             f.rrf_score,
             (fp."recipeId" IS NOT NULL) AS is_favorite,
             (pp."recipeId" IS NOT NULL) AS is_pinned
      FROM fused f
      JOIN "Recipe" r ON r.id = f.id
      LEFT JOIN "FavoriteRecipe" fp ON fp."recipeId" = r.id AND fp."userId" = COALESCE($userId, '')
      LEFT JOIN "PinnedRecipe"   pp ON pp."recipeId" = r.id AND pp."userId" = COALESCE($userId, '')
      WHERE r."isDeleted" = false
        AND ${userVisibilitySQL}
    )
    SELECT
      j.id, j."userId", j.title, j.description, j.ingredients,
      j."cuisineType", j."mealType", j."imageUrl", j."sourceUrl",
      j."favoriteCount", j.is_favorite AS "isFavorite", j.is_pinned AS "isPinned",
      (
        j.rrf_score
        + 0.05 * ln(1 + j."favoriteCount")
        + CASE WHEN j.is_favorite THEN 0.1 ELSE 0 END
        + CASE WHEN j.is_pinned   THEN 0.15 ELSE 0 END
      ) AS "finalScore",
      ts_headline(
        'english',
        j.title,
        websearch_to_tsquery('english', $query),
        'StartSel=<mark>, StopSel=</mark>, HighlightAll=true'
      ) AS "titleHighlight"
    FROM joined j
    ${filters.isFavorite ? `WHERE j.is_favorite = true` : ""}
    ${filters.isPinned ? (filters.isFavorite ? `AND j.is_pinned = true` : `WHERE j.is_pinned = true`) : ""}
    ORDER BY "finalScore" DESC
    LIMIT ${Number(limit)};
  `;

  return runParameterized<HybridRecipeResult>(sql, {
    userId: userId ?? "",
    query: tsQuery,
    trgm: trgmQuery,
    cuisineFilter,
    mealFilter,
  });
}

// ─────────────────────────── Cookbook-recipe search ───────────────────────────

export async function searchCookbookRecipesHybrid(
  userId: string,
  rawQuery: string,
  opts: { limit?: number } = {}
): Promise<HybridCookbookResult[]> {
  if (!isQueryActionable(rawQuery)) return [];
  const limit = opts.limit ?? 10;
  const tsQuery = buildWebsearchQuery(rawQuery);
  const trgmQuery = rawQuery.trim().toLowerCase();

  // Vector search on CookbookRecipe goes through RecipeChunk
  // (that's where embeddings live for this entity).
  let embeddingLiteral: string | null = null;
  try {
    const embedding = await getCachedQueryEmbedding(rawQuery);
    embeddingLiteral = `[${embedding.join(",")}]`;
  } catch (err) {
    console.warn("[hybrid-search] cookbook embedding failed, lexical+fuzzy only", err);
  }

  const vectorCTE = embeddingLiteral
    ? `
    vec AS (
      SELECT rc."cookbookRecipeId" AS id,
             row_number() OVER (ORDER BY rc.embedding <=> '${embeddingLiteral}'::vector) AS rank
      FROM "RecipeChunk" rc
      JOIN "CookbookRecipe" cr ON cr.id = rc."cookbookRecipeId"
      WHERE cr."userId" = $userId
        AND rc.embedding IS NOT NULL
      ORDER BY rc.embedding <=> '${embeddingLiteral}'::vector
      LIMIT 50
    ),`
    : `
    vec AS (SELECT ''::text AS id, 0::bigint AS rank WHERE FALSE),`;

  const sql = `
    WITH fts AS (
      SELECT cr.id,
             row_number() OVER (
               ORDER BY ts_rank_cd(cr."searchVector", websearch_to_tsquery('english', $query)) DESC
             ) AS rank
      FROM "CookbookRecipe" cr
      WHERE cr."userId" = $userId
        AND cr."searchVector" @@ websearch_to_tsquery('english', $query)
      LIMIT 100
    ),
    trgm AS (
      SELECT cr.id,
             row_number() OVER (ORDER BY similarity(cr.title, $trgm) DESC) AS rank
      FROM "CookbookRecipe" cr
      WHERE cr."userId" = $userId
        AND cr.title % $trgm
      LIMIT 50
    ),
    ${vectorCTE}
    fused AS (
      SELECT id, SUM(1.0 / (60 + rank)) AS rrf_score
      FROM (
        SELECT id, rank FROM fts
        UNION ALL
        SELECT id, rank FROM trgm
        UNION ALL
        SELECT id, rank FROM vec
      ) u
      GROUP BY id
    )
    SELECT
      cr.id, cr."cookbookId", cr.title, cr.description, cr."cuisineType",
      cr."imageUrl",
      cb.title AS "cookbookTitle",
      cb.author AS "cookbookAuthor",
      cb."coverUrl" AS "cookbookCoverUrl",
      f.rrf_score AS "finalScore",
      ts_headline(
        'english',
        cr.title,
        websearch_to_tsquery('english', $query),
        'StartSel=<mark>, StopSel=</mark>, HighlightAll=true'
      ) AS "titleHighlight"
    FROM fused f
    JOIN "CookbookRecipe" cr ON cr.id = f.id
    JOIN "Cookbook" cb ON cb.id = cr."cookbookId"
    ORDER BY f.rrf_score DESC
    LIMIT ${Number(limit)};
  `;

  return runParameterized<HybridCookbookResult>(sql, {
    userId,
    query: tsQuery,
    trgm: trgmQuery,
  });
}

// ─────────────────────────── Helpers ───────────────────────────

/**
 * Tiny parameterized query runner. We use named placeholders ($name)
 * in the SQL and resolve them to positional $1, $2, ... for Postgres.
 * This keeps the SQL above readable without hand-counting indices.
 */
async function runParameterized<T>(
  sql: string,
  params: Record<string, unknown>
): Promise<T[]> {
  const paramNames: string[] = [];
  const transformed = sql.replace(/\$([a-zA-Z][a-zA-Z0-9_]*)/g, (_m, name) => {
    let idx = paramNames.indexOf(name);
    if (idx === -1) {
      paramNames.push(name);
      idx = paramNames.length - 1;
    }
    return `$${idx + 1}`;
  });
  const values = paramNames.map((n) => params[n]);
  return prisma.$queryRawUnsafe<T[]>(transformed, ...values);
}

export { tokenize };

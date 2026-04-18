/**
 * Pure helpers for hybrid-search query building.
 * No DB access here — kept isolated so it's trivially unit-testable.
 */

/**
 * Normalize a user-typed search string into tokens.
 * - lowercases
 * - strips punctuation except intra-word apostrophes ("fish shop's" → "fish shops")
 * - drops empty tokens
 * - caps to 8 tokens (protects against runaway queries)
 */
export function tokenize(raw: string): string[] {
  if (!raw) return [];
  const lowered = raw.toLowerCase().replace(/[\u2018\u2019']/g, "");
  // Split on anything that isn't a letter/number (unicode-aware)
  const tokens = lowered.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return tokens.slice(0, 8);
}

/**
 * Build a websearch_to_tsquery-compatible string.
 * websearch_to_tsquery already handles unquoted multi-term input
 * (joins with & implicitly), but we normalize first so accidental
 * operator chars like `:` or `!` don't alter semantics.
 */
export function buildWebsearchQuery(raw: string): string {
  const tokens = tokenize(raw);
  return tokens.join(" ");
}

/**
 * Reciprocal Rank Fusion.
 * Takes N ranked lists of ids and returns a map of id → fused score.
 * k=60 is the canonical default (Cormack et al. 2009).
 */
export function reciprocalRankFusion(
  rankedLists: Array<Array<{ id: string }>>,
  k = 60
): Map<string, number> {
  const scores = new Map<string, number>();
  for (const list of rankedLists) {
    list.forEach((item, idx) => {
      const rank = idx + 1;
      const contribution = 1 / (k + rank);
      scores.set(item.id, (scores.get(item.id) ?? 0) + contribution);
    });
  }
  return scores;
}

/**
 * Minimum query length before we bother hitting the DB.
 * One-letter queries are almost always useless and expensive.
 */
export const MIN_QUERY_LENGTH = 2;

export function isQueryActionable(raw: string): boolean {
  return raw.trim().length >= MIN_QUERY_LENGTH;
}

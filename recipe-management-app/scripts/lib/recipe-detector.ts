/**
 * Stage 4: Detect recipe boundaries using windowed Claude Sonnet calls.
 *
 * Splits the cookbook into overlapping windows of pages, asks Claude
 * to identify recipe start/end boundaries in each window, then
 * deduplicates overlapping results by normalized title.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  RecipeBoundary,
  RecipeBoundaryListSchema,
  PageTextMap,
  CLAUDE_HAIKU,
  WINDOW_SIZE,
  WINDOW_OVERLAP,
  MAX_CONCURRENT_WINDOWS,
  extractJson,
} from "./pipeline-types";
import { pMap } from "./rate-limiter";

interface PageWindow {
  startPage: number;
  endPage: number;
  text: string;
}

/**
 * Create overlapping windows from page text.
 */
export function createWindows(pageTexts: PageTextMap): PageWindow[] {
  const totalPages = pageTexts.size;
  if (totalPages === 0) return [];

  const step = WINDOW_SIZE - WINDOW_OVERLAP;
  const windows: PageWindow[] = [];

  for (let start = 1; start <= totalPages; start += step) {
    const end = Math.min(start + WINDOW_SIZE - 1, totalPages);
    const parts: string[] = [];

    for (let p = start; p <= end; p++) {
      const text = pageTexts.get(p);
      if (text) {
        parts.push(`--- Page ${p} ---\n${text}`);
      }
    }

    windows.push({
      startPage: start,
      endPage: end,
      text: parts.join("\n\n"),
    });

    // If we've reached the end, stop
    if (end >= totalPages) break;
  }

  return windows;
}

/**
 * Detect recipe boundaries in a single window.
 */
async function detectWindowBoundaries(
  anthropic: Anthropic,
  window: PageWindow
): Promise<RecipeBoundary[]> {
  const response = await anthropic.messages.create({
    model: CLAUDE_HAIKU,
    max_tokens: 8192,
    temperature: 0,
    system: `You are an assistant that identifies recipe boundaries in cookbook text.

Given a section of a cookbook (pages ${window.startPage}-${window.endPage}), identify each distinct recipe and its page range.

Return JSON in this exact format:
{
  "recipes": [
    {
      "title": "Recipe Name",
      "startPage": 5,
      "endPage": 6
    }
  ]
}

Rules:
- Only include actual recipes (with ingredients and instructions), not chapter introductions, tips, or essays.
- The title should be the recipe's actual name as written in the cookbook.
- startPage is the page where the recipe title appears.
- endPage is the last page containing content for that recipe (ingredients or instructions).
- If a recipe spans a single page, startPage and endPage are the same.
- If no recipes are found in this section, return {"recipes": []}.
- Return valid JSON only. No markdown fences, no extra text.`,
    messages: [
      {
        role: "user",
        content: window.text,
      },
    ],
  });

  if (response.stop_reason === "max_tokens") {
    console.warn(
      `[Detector] WARNING: Response truncated for window pages ${window.startPage}-${window.endPage}. Output may be incomplete.`
    );
  }

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    // Attempt to recover truncated JSON by closing the array and object
    const raw = extractJson(text);
    // Find the last complete recipe object (ends with "}")
    const lastBrace = raw.lastIndexOf("}");
    if (lastBrace > 0) {
      const truncated = raw.slice(0, lastBrace + 1) + "]}";
      try {
        parsed = JSON.parse(truncated);
        console.warn(
          `[Detector] Recovered truncated JSON for window pages ${window.startPage}-${window.endPage} (some recipes may be missing).`
        );
      } catch {
        console.warn(
          `[Detector] Could not parse response for window pages ${window.startPage}-${window.endPage}, skipping.`
        );
        return [];
      }
    } else {
      console.warn(
        `[Detector] Empty/invalid response for window pages ${window.startPage}-${window.endPage}, skipping.`
      );
      return [];
    }
  }

  const validated = RecipeBoundaryListSchema.safeParse(parsed);

  if (!validated.success) {
    console.warn(
      `[Detector] Validation failed for window pages ${window.startPage}-${window.endPage}: ${validated.error.message}`
    );
    return [];
  }

  return validated.data.recipes;
}

/**
 * Normalize a recipe title for deduplication.
 */
function normalizeTitle(title: string): string {
  return title
    .replace(/\[.*?\]/g, "") // Strip bracketed subtitles before comparing
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Deduplicate recipe boundaries from overlapping windows.
 * When the same recipe appears in multiple windows, keep the widest page range.
 */
export function deduplicateBoundaries(
  boundaries: RecipeBoundary[]
): RecipeBoundary[] {
  const seen = new Map<
    string,
    { title: string; startPage: number; endPage: number }
  >();

  for (const b of boundaries) {
    const key = normalizeTitle(b.title);
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, { ...b });
    } else {
      // Keep widest page range, prefer original title casing
      existing.startPage = Math.min(existing.startPage, b.startPage);
      existing.endPage = Math.max(existing.endPage, b.endPage);
    }
  }

  // Sort by startPage
  return Array.from(seen.values()).sort((a, b) => a.startPage - b.startPage);
}

/**
 * Detect all recipe boundaries in the cookbook using windowed analysis.
 */
export async function detectRecipeBoundaries(
  anthropic: Anthropic,
  pageTexts: PageTextMap
): Promise<RecipeBoundary[]> {
  const windows = createWindows(pageTexts);
  console.log(
    `[Detector] Created ${windows.length} windows (${WINDOW_SIZE}-page windows, ${WINDOW_OVERLAP}-page overlap).`
  );

  // Process windows with bounded concurrency
  const windowResults = await pMap(
    windows,
    async (window, index) => {
      console.log(
        `[Detector] Processing window ${index + 1}/${windows.length} (pages ${window.startPage}-${window.endPage})...`
      );
      return detectWindowBoundaries(anthropic, window);
    },
    MAX_CONCURRENT_WINDOWS
  );

  // Flatten and deduplicate
  const allBoundaries = windowResults.flat();
  const deduplicated = deduplicateBoundaries(allBoundaries);

  console.log(
    `[Detector] Found ${allBoundaries.length} raw boundaries → ${deduplicated.length} unique recipes after dedup.`
  );

  return deduplicated;
}

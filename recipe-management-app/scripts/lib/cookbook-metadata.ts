/**
 * Stage 3: Extract cookbook metadata.
 *
 * 1. If a metadata.opf file exists alongside the PDF, parse it (structured XML).
 * 2. Otherwise, fall back to Claude Haiku extracting metadata from page text.
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import {
  CookbookMetadata,
  CookbookMetadataSchema,
  CLAUDE_HAIKU,
  PageTextMap,
  extractJson,
} from "./pipeline-types";

/**
 * Parse OPF XML content for structured metadata.
 * Returns null if the content can't be parsed.
 */
function parseOpfXml(xml: string): CookbookMetadata | null {

  const getTag = (tag: string): string | null => {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`));
    return match ? match[1].trim() : null;
  };

  const title = getTag("dc:title");
  if (!title) return null; // Title is required

  const author = getTag("dc:creator");
  const publisher = getTag("dc:publisher");

  // Year from dc:date (e.g. "2025-03-18T00:00:00+00:00")
  const dateStr = getTag("dc:date");
  const year = dateStr ? parseInt(dateStr.slice(0, 4), 10) || null : null;

  // ISBN from dc:identifier with opf:scheme="ISBN"
  const isbnMatch = xml.match(
    /<dc:identifier[^>]*opf:scheme="ISBN"[^>]*>([^<]+)<\/dc:identifier>/
  );
  const isbn = isbnMatch ? isbnMatch[1].trim() : null;

  // Description — strip HTML tags
  const descMatch = xml.match(
    /<dc:description>([^]*?)<\/dc:description>/
  );
  let description: string | null = null;
  if (descMatch) {
    description = descMatch[1]
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/<[^>]+>/g, "") // strip HTML
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500); // truncate for DB
  }

  return { title, author, publisher, year, isbn, description };
}

/**
 * Try to load an external Calibre metadata.opf file alongside the ebook.
 */
function loadExternalOpf(filePath: string): string | null {
  const dir = path.dirname(filePath);
  const opfPath = path.join(dir, "metadata.opf");

  if (!fs.existsSync(opfPath)) {
    return null;
  }

  console.log(`[Metadata] Found metadata.opf at ${opfPath}`);
  return fs.readFileSync(opfPath, "utf-8");
}

/**
 * Extract cookbook metadata.
 *
 * Priority:
 * 1. External metadata.opf file (Calibre) alongside the ebook
 * 2. Embedded OPF from EPUB (passed in from epub-extractor)
 * 3. Claude Haiku fallback
 */
export async function extractCookbookMetadata(
  anthropic: Anthropic,
  pageTexts: PageTextMap,
  filePath?: string,
  embeddedOpfXml?: string | null
): Promise<CookbookMetadata> {
  // Try external OPF first (Calibre metadata.opf alongside the file)
  if (filePath) {
    const externalOpf = loadExternalOpf(filePath);
    if (externalOpf) {
      const opfData = parseOpfXml(externalOpf);
      if (opfData) {
        console.log(`[Metadata] Title: "${opfData.title}" (from external OPF)`);
        if (opfData.author) console.log(`[Metadata] Author: ${opfData.author}`);
        return opfData;
      }
    }
  }

  // Try embedded OPF from EPUB
  if (embeddedOpfXml) {
    const opfData = parseOpfXml(embeddedOpfXml);
    if (opfData) {
      console.log(`[Metadata] Title: "${opfData.title}" (from embedded OPF)`);
      if (opfData.author) console.log(`[Metadata] Author: ${opfData.author}`);
      return opfData;
    }
  }

  // Fall back to Claude
  console.log("[Metadata] No OPF metadata found, using Claude to extract metadata...");
  return extractMetadataWithClaude(anthropic, pageTexts, filePath);
}

async function extractMetadataWithClaude(
  anthropic: Anthropic,
  pageTexts: PageTextMap,
  filePath?: string
): Promise<CookbookMetadata> {
  // Use first 8 pages — covers, copyright, TOC, dedication, etc.
  const pagesForMetadata = Math.min(8, pageTexts.size);
  const textSample: string[] = [];

  for (let i = 1; i <= pagesForMetadata; i++) {
    const text = pageTexts.get(i);
    if (text) {
      textSample.push(`--- Page ${i} ---\n${text}`);
    }
  }

  // Extract filename hint
  const filenameHint = filePath
    ? path.basename(filePath, path.extname(filePath))
    : null;

  const response = await anthropic.messages.create({
    model: CLAUDE_HAIKU,
    max_tokens: 1024,
    temperature: 0,
    system: `You are an assistant that extracts metadata from cookbook text.
Given the first several pages of a cookbook, extract the following information as JSON:

{
  "title": "The cookbook title",
  "author": "Author name(s) or null",
  "publisher": "Publisher name or null",
  "year": 2024 or null,
  "isbn": "ISBN string or null",
  "description": "Brief description of the cookbook or null"
}

Rules:
- The title MUST be a non-null string. If the title isn't explicit in the text, infer it from the copyright notice, filename hint, or table of contents.
- Look for the author in copyright notices (e.g. "Copyright © 2025 Author Name").
- Look for the year in copyright notices.
- Return valid JSON only. No markdown fences, no extra text.
- If a field other than title cannot be determined, use null.`,
    messages: [
      {
        role: "user",
        content: `${filenameHint ? `Filename hint: "${filenameHint}"\n\n` : ""}Extract metadata from this cookbook:\n\n${textSample.join("\n\n")}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = JSON.parse(extractJson(text));
  const validated = CookbookMetadataSchema.safeParse(parsed);

  if (!validated.success) {
    throw new Error(
      `Cookbook metadata validation failed: ${validated.error.message}`
    );
  }

  console.log(`[Metadata] Title: "${validated.data.title}" (from Claude)`);
  if (validated.data.author) {
    console.log(`[Metadata] Author: ${validated.data.author}`);
  }

  return validated.data;
}

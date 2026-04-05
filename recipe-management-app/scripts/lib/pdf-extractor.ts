/**
 * Stage 2: Extract text from each page of a PDF file using pdf-parse v2.
 */

import fs from "fs";
import { PDFParse, VerbosityLevel } from "pdf-parse";
import { PageTextMap } from "./pipeline-types";

export interface PdfExtractionResult {
  pageTexts: PageTextMap;
  totalPages: number;
}

/**
 * Extract per-page text from a PDF file.
 * Returns a Map of pageNumber → text content, plus total page count.
 */
export async function extractPdfText(filePath: string): Promise<PdfExtractionResult> {
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({
    data: buffer,
    verbosity: VerbosityLevel.ERRORS,
  });

  const info = await parser.getInfo();
  const totalPages = info.total;

  const pageTexts: PageTextMap = new Map();
  let emptyPages = 0;

  // Extract text one page at a time to get per-page content
  for (let page = 1; page <= totalPages; page++) {
    const result = await parser.getText({ partial: [page] });
    // pdf-parse v2 appends "-- X of Y --" footer to each page; strip it
    const text = result.text
      .replace(/\n*--\s*\d+\s*of\s*\d+\s*--\s*$/i, "")
      .trim();
    pageTexts.set(page, text);

    if (!text) {
      emptyPages++;
    }
  }

  await parser.destroy();

  if (emptyPages > 0) {
    console.warn(
      `[PDF] Warning: ${emptyPages} of ${totalPages} pages have no extractable text (may be image-only).`
    );
  }

  console.log(`[PDF] Extracted text from ${totalPages} pages.`);
  return { pageTexts, totalPages };
}

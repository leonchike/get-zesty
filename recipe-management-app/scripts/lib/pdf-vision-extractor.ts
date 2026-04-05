/**
 * Stage 2 fallback: OCR image-based PDFs using Claude Vision.
 *
 * When pdf-parse returns mostly empty pages (scanned/image-based PDF),
 * this module converts each page to a JPEG via pdftoppm (poppler-utils),
 * then sends page images to Claude Vision for text extraction.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import Anthropic from "@anthropic-ai/sdk";
import { PageTextMap, CLAUDE_SONNET } from "./pipeline-types";
import { pMap } from "./rate-limiter";

const VISION_CONCURRENCY = 3;
const JPEG_QUALITY = 85;
const DPI = 200; // Balance between quality and file size

/**
 * Check if pdftoppm (poppler-utils) is available.
 */
function hasPdftoppm(): boolean {
  try {
    execSync("which pdftoppm", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert PDF pages to JPEG images using pdftoppm.
 * Returns the temp directory and a map of page number → image path.
 */
function convertPdfToImages(
  pdfPath: string,
  totalPages: number
): { tmpDir: string; pageImages: Map<number, string> } {
  const tmpDir = fs.mkdtempSync(
    path.join(
      process.env.TMPDIR || "/tmp",
      "cookbook-ocr-"
    )
  );
  const prefix = path.join(tmpDir, "page");

  console.log(
    `[Vision OCR] Converting ${totalPages} pages to images (${DPI} DPI)...`
  );

  execSync(
    `pdftoppm -jpeg -jpegopt quality=${JPEG_QUALITY} -r ${DPI} "${pdfPath}" "${prefix}"`,
    { stdio: "pipe", maxBuffer: 100 * 1024 * 1024 }
  );

  // pdftoppm outputs files as prefix-01.jpg, prefix-02.jpg, etc.
  const pageImages = new Map<number, string>();
  for (let page = 1; page <= totalPages; page++) {
    // pdftoppm pads to the width of the total page count
    const padWidth = String(totalPages).length;
    const paddedNum = String(page).padStart(padWidth, "0");
    const imgPath = `${prefix}-${paddedNum}.jpg`;

    if (fs.existsSync(imgPath)) {
      pageImages.set(page, imgPath);
    }
  }

  console.log(`[Vision OCR] Converted ${pageImages.size} page images.`);
  return { tmpDir, pageImages };
}

/**
 * Send a single page image to Claude Vision for OCR.
 */
async function ocrPage(
  anthropic: Anthropic,
  imagePath: string,
  pageNumber: number
): Promise<string> {
  const imageData = fs.readFileSync(imagePath).toString("base64");

  const response = await anthropic.messages.create({
    model: CLAUDE_SONNET,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageData,
            },
          },
          {
            type: "text",
            text: `Extract ALL text from this cookbook page image. Preserve the structure:
- Recipe titles on their own line
- Ingredient lists as bullet points or line-separated items
- Instructions as numbered steps if present
- Keep headnotes, tips, and serving suggestions
- Preserve section headings

Return ONLY the extracted text, no commentary. If the page has no readable text (blank, decorative, or just a photo), return an empty string.`,
          },
        ],
      },
    ],
  });

  return response.content[0].type === "text"
    ? response.content[0].text.trim()
    : "";
}

/**
 * Determine if a PDF extraction result indicates an image-based (scanned) PDF.
 * Returns true if more than half the pages are empty or near-empty.
 */
export function needsVisionOcr(pageTexts: PageTextMap): boolean {
  if (pageTexts.size === 0) return false;

  let emptyCount = 0;
  for (const [, text] of pageTexts) {
    // A page with less than 50 characters is effectively empty
    // (may contain just page numbers or headers from pdf-parse artifacts)
    if (text.length < 50) {
      emptyCount++;
    }
  }

  const emptyRatio = emptyCount / pageTexts.size;
  return emptyRatio > 0.5;
}

/**
 * Extract text from an image-based PDF using Claude Vision OCR.
 */
export async function extractPdfWithVision(
  anthropic: Anthropic,
  pdfPath: string,
  totalPages: number
): Promise<PageTextMap> {
  if (!hasPdftoppm()) {
    throw new Error(
      "Vision OCR requires pdftoppm (poppler-utils). Install with: brew install poppler"
    );
  }

  const { tmpDir, pageImages } = convertPdfToImages(pdfPath, totalPages);

  try {
    const pages = Array.from(pageImages.entries()).sort(
      ([a], [b]) => a - b
    );
    const pageTexts: PageTextMap = new Map();
    let processedCount = 0;

    const results = await pMap(
      pages,
      async ([pageNum, imgPath]) => {
        const text = await ocrPage(anthropic, imgPath, pageNum);
        processedCount++;
        if (processedCount % 10 === 0 || processedCount === pages.length) {
          console.log(
            `[Vision OCR] Processed ${processedCount}/${pages.length} pages...`
          );
        }
        return { pageNum, text };
      },
      VISION_CONCURRENCY
    );

    let emptyPages = 0;
    for (const { pageNum, text } of results) {
      pageTexts.set(pageNum, text);
      if (!text) emptyPages++;
    }

    if (emptyPages > 0) {
      console.log(
        `[Vision OCR] ${emptyPages} pages had no extractable text (likely photos/blank pages).`
      );
    }

    console.log(
      `[Vision OCR] Extracted text from ${totalPages} pages via Claude Vision.`
    );
    return pageTexts;
  } finally {
    // Clean up temp images
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

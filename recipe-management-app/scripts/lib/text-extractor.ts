/**
 * Unified text extraction dispatcher.
 *
 * Selects the appropriate extractor based on file extension:
 *   - .pdf  → pdf-parse (native), with Claude Vision OCR fallback for scanned PDFs
 *   - .epub → jszip + XHTML parsing (native)
 *   - .mobi/.azw/.azw3/etc → ebook-convert to EPUB, then EPUB extractor
 */

import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { PageTextMap } from "./pipeline-types";
import { extractPdfText } from "./pdf-extractor";
import { extractEpubText } from "./epub-extractor";
import { needsVisionOcr, extractPdfWithVision } from "./pdf-vision-extractor";
import {
  convertToEpub,
  isSupportedFormat,
  needsConversion,
  SUPPORTED_EXTENSIONS,
} from "./ebook-converter";

export interface ExtractionResult {
  pageTexts: PageTextMap;
  /** Raw OPF XML from EPUB files (used for metadata extraction) */
  embeddedOpfXml: string | null;
  /** Temp file to clean up after pipeline completes (converted ebooks) */
  tempFile: string | null;
}

/**
 * Extract text from any supported ebook format.
 * For PDFs, automatically falls back to Claude Vision OCR if text extraction
 * yields mostly empty pages (image-based/scanned PDFs).
 */
export async function extractText(
  filePath: string,
  anthropic?: Anthropic
): Promise<ExtractionResult> {
  if (!isSupportedFormat(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    throw new Error(
      `Unsupported file format: ${ext}\n` +
        `Supported formats: ${SUPPORTED_EXTENSIONS.join(", ")}`
    );
  }

  const ext = path.extname(filePath).toLowerCase();

  // PDF: native extraction with Vision OCR fallback
  if (ext === ".pdf") {
    const { pageTexts, totalPages } = await extractPdfText(filePath);

    // Check if this is a scanned/image-based PDF
    if (needsVisionOcr(pageTexts)) {
      if (!anthropic) {
        throw new Error(
          "Image-based PDF detected but no Anthropic client provided for Vision OCR fallback."
        );
      }

      console.log(
        `[PDF] Detected image-based PDF (most pages have no selectable text).`
      );
      console.log(
        `[PDF] Falling back to Claude Vision OCR for ${totalPages} pages...`
      );

      const visionTexts = await extractPdfWithVision(
        anthropic,
        filePath,
        totalPages
      );
      return { pageTexts: visionTexts, embeddedOpfXml: null, tempFile: null };
    }

    return { pageTexts, embeddedOpfXml: null, tempFile: null };
  }

  // EPUB: native extraction
  if (ext === ".epub") {
    const { pageTexts, opfXml } = await extractEpubText(filePath);
    return { pageTexts, embeddedOpfXml: opfXml, tempFile: null };
  }

  // Other formats: convert to EPUB first
  if (needsConversion(filePath)) {
    const epubPath = await convertToEpub(filePath);
    try {
      const { pageTexts, opfXml } = await extractEpubText(epubPath);
      return { pageTexts, embeddedOpfXml: opfXml, tempFile: epubPath };
    } catch (error) {
      // Clean up on extraction failure
      fs.rmSync(path.dirname(epubPath), { recursive: true, force: true });
      throw error;
    }
  }

  throw new Error(`No extractor available for ${ext}`);
}

/**
 * Clean up any temporary files created during extraction.
 */
export function cleanupTempFiles(result: ExtractionResult): void {
  if (result.tempFile) {
    try {
      const tmpDir = path.dirname(result.tempFile);
      fs.rmSync(tmpDir, { recursive: true, force: true });
      console.log("[Cleanup] Removed temporary conversion files.");
    } catch {
      // Best effort cleanup
    }
  }
}

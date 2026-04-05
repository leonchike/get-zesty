/**
 * Convert unsupported ebook formats (MOBI, AZW3, etc.) to EPUB
 * using Calibre's `ebook-convert` CLI tool.
 */

import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const EBOOK_CONVERT_PATHS = [
  "ebook-convert", // In PATH
  "/opt/homebrew/bin/ebook-convert", // macOS Homebrew
  "/usr/bin/ebook-convert", // Linux
  "/Applications/calibre.app/Contents/MacOS/ebook-convert", // macOS app bundle
];

/**
 * Find the ebook-convert binary.
 */
function findEbookConvert(): string | null {
  for (const cmd of EBOOK_CONVERT_PATHS) {
    try {
      execFileSync(cmd, ["--version"], { stdio: "ignore" });
      return cmd;
    } catch {
      // Not found at this path, try next
    }
  }
  return null;
}

/**
 * Convert an ebook file to EPUB format using Calibre's ebook-convert.
 * Returns the path to the converted EPUB file in a temp directory.
 *
 * Throws if ebook-convert is not installed or conversion fails.
 */
export async function convertToEpub(filePath: string): Promise<string> {
  const converter = findEbookConvert();
  if (!converter) {
    throw new Error(
      "Calibre's ebook-convert is required to process this file format.\n" +
        "Install Calibre from https://calibre-ebook.com/download\n" +
        "Or convert the file to PDF or EPUB manually."
    );
  }

  const ext = path.extname(filePath).toLowerCase();
  const baseName = path.basename(filePath, ext);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cookbook-convert-"));
  const outputPath = path.join(tmpDir, `${baseName}.epub`);

  console.log(`[Convert] Converting ${ext} to EPUB using ebook-convert...`);

  try {
    execFileSync(converter, [filePath, outputPath], {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 300_000, // 5 minute timeout
    });
  } catch (error: any) {
    // Clean up temp dir on failure
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw new Error(
      `ebook-convert failed: ${error.stderr?.toString() || error.message}`
    );
  }

  if (!fs.existsSync(outputPath)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw new Error("ebook-convert produced no output file.");
  }

  console.log(`[Convert] Conversion complete: ${outputPath}`);
  return outputPath;
}

/**
 * Supported file extensions for the ingestion pipeline.
 */
export const SUPPORTED_EXTENSIONS = [
  ".pdf",
  ".epub",
  ".mobi",
  ".azw",
  ".azw3",
  ".fb2",
  ".djvu",
  ".cbz",
  ".cbr",
];

/**
 * Extensions that need conversion to EPUB before processing.
 */
export const NEEDS_CONVERSION = [
  ".mobi",
  ".azw",
  ".azw3",
  ".fb2",
  ".djvu",
  ".cbz",
  ".cbr",
];

export function isSupportedFormat(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

export function needsConversion(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return NEEDS_CONVERSION.includes(ext);
}

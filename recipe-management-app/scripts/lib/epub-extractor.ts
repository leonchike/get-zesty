/**
 * Extract text from an EPUB file.
 *
 * EPUB is a ZIP archive containing XHTML content files.
 * We parse the OPF manifest to get the spine (reading order),
 * then extract text from each content document in order.
 */

import fs from "fs";
import JSZip from "jszip";
import { PageTextMap } from "./pipeline-types";

/**
 * Strip HTML tags and convert to plain text.
 */
function htmlToText(html: string): string {
  return (
    html
      // Remove <script> and <style> blocks
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
      // Convert block-level tags to newlines
      .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|br\s*\/?)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      // Strip remaining tags
      .replace(/<[^>]+>/g, "")
      // Decode common HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      )
      // Collapse whitespace
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/**
 * Parse the OPF content to extract spine item hrefs in reading order.
 */
function parseSpine(
  opfContent: string,
  opfDir: string
): { id: string; href: string }[] {
  // Build id → href map from <manifest>
  // Match each <item .../> tag, then extract id and href independently
  // so attribute order doesn't matter (some EPUBs have href before id)
  const itemMap = new Map<string, string>();
  const itemTagRegex = /<item\s[^>]*?\/?>/g;
  let tagMatch;
  while ((tagMatch = itemTagRegex.exec(opfContent)) !== null) {
    const tag = tagMatch[0];
    const idMatch = tag.match(/\bid="([^"]+)"/);
    const hrefMatch = tag.match(/\bhref="([^"]+)"/);
    if (idMatch && hrefMatch) {
      itemMap.set(idMatch[1], hrefMatch[1]);
    }
  }

  // Get spine order from <itemref> elements
  const spineItems: { id: string; href: string }[] = [];
  const itemrefTagRegex = /<itemref\s[^>]*?\/?>/g;
  while ((tagMatch = itemrefTagRegex.exec(opfContent)) !== null) {
    const tag = tagMatch[0];
    const idrefMatch = tag.match(/\bidref="([^"]+)"/);
    if (idrefMatch) {
      const id = idrefMatch[1];
      const href = itemMap.get(id);
      if (href) {
        // Resolve href relative to OPF directory
        const resolved = opfDir ? `${opfDir}/${href}` : href;
        spineItems.push({ id, href: resolved });
      }
    }
  }

  return spineItems;
}

/**
 * Find the OPF file path from META-INF/container.xml.
 */
function findOpfPath(containerXml: string): string | null {
  const match = containerXml.match(
    /<rootfile[^>]+full-path="([^"]+)"[^>]*?>/
  );
  return match ? match[1] : null;
}

const VIRTUAL_PAGE_SIZE = 3000;

function splitIntoVirtualPages(text: string, targetSize: number): string[] {
  if (!text.trim()) return [];
  if (text.length <= targetSize) return [text];

  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  const pages: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current && (current.length + para.length + 2) > targetSize) {
      pages.push(current.trim());
      current = para;
    } else {
      current = current ? current + "\n\n" + para : para;
    }
  }
  if (current.trim()) pages.push(current.trim());

  return pages;
}

/**
 * Extract per-section text from an EPUB file.
 * Each spine item (chapter/section) maps to a sequential "page" number.
 * Returns the same PageTextMap type as the PDF extractor.
 *
 * Also returns the raw OPF XML content for metadata extraction.
 */
export async function extractEpubText(
  filePath: string
): Promise<{ pageTexts: PageTextMap; opfXml: string | null }> {
  const buffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buffer);

  // Find OPF file via container.xml
  const containerFile = zip.file("META-INF/container.xml");
  if (!containerFile) {
    throw new Error("Invalid EPUB: missing META-INF/container.xml");
  }

  const containerXml = await containerFile.async("string");
  const opfPath = findOpfPath(containerXml);
  if (!opfPath) {
    throw new Error("Invalid EPUB: could not find OPF path in container.xml");
  }

  const opfFile = zip.file(opfPath);
  if (!opfFile) {
    throw new Error(`Invalid EPUB: OPF file not found at ${opfPath}`);
  }

  const opfContent = await opfFile.async("string");
  const opfDir = opfPath.includes("/")
    ? opfPath.substring(0, opfPath.lastIndexOf("/"))
    : "";

  // Parse spine for reading order
  const spineItems = parseSpine(opfContent, opfDir);

  if (spineItems.length === 0) {
    throw new Error("Invalid EPUB: no spine items found in OPF");
  }

  const pageTexts: PageTextMap = new Map();
  let emptyPages = 0;
  let pageNumber = 1;

  for (const item of spineItems) {
    const file = zip.file(item.href);
    if (!file) continue;

    const xhtml = await file.async("string");
    const text = htmlToText(xhtml);

    if (text) {
      const virtualPages = splitIntoVirtualPages(text, VIRTUAL_PAGE_SIZE);
      for (const vp of virtualPages) {
        pageTexts.set(pageNumber++, vp);
      }
    } else {
      pageTexts.set(pageNumber++, "");
      emptyPages++;
    }
  }

  if (emptyPages > 0) {
    console.warn(
      `[EPUB] Warning: ${emptyPages} of ${spineItems.length} sections have no extractable text.`
    );
  }

  console.log(
    `[EPUB] Extracted ${spineItems.length} sections → ${pageTexts.size} virtual pages (~${VIRTUAL_PAGE_SIZE} chars/page).`
  );

  return { pageTexts, opfXml: opfContent };
}

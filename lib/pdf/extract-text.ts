import { ToolError } from '../api-utils';

/**
 * Extracts text from a PDF using pdfjs-dist (already a dependency). Returns the
 * text page-by-page. Used by "PDF to Text" and "PDF to Markdown".
 *
 * Note: this reads the PDF's embedded text layer — it does NOT OCR scanned
 * images. For scanned PDFs, use the OCR tool first (see SETUP-REQUIRED.md #4).
 */
export async function extractPdfText(input: Buffer): Promise<string[]> {
  const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.js');

  let doc;
  try {
    doc = await pdfjsLib.getDocument({ data: new Uint8Array(input), isEvalSupported: false }).promise;
  } catch {
    throw new ToolError('This file is not a valid or is a password-protected PDF.');
  }

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // Join text items, inserting line breaks when the vertical position jumps.
    let lastY: number | null = null;
    let line = '';
    const lines: string[] = [];
    for (const item of content.items as any[]) {
      const y = item.transform?.[5];
      if (lastY !== null && Math.abs((y ?? 0) - lastY) > 3) {
        lines.push(line.trimEnd());
        line = '';
      }
      line += item.str;
      lastY = y ?? lastY;
    }
    if (line.trim()) lines.push(line.trimEnd());
    pages.push(lines.join('\n'));
    page.cleanup();
  }
  return pages;
}

/** Plain text: pages separated by a form-feed / blank line. */
export function toPlainText(pages: string[]): string {
  return pages.join('\n\n').trim() + '\n';
}

/**
 * Very lightweight Markdown: treat short ALL-CAPS or title-ish lines as
 * headings, keep paragraphs, and add a page separator. Not perfect, but a
 * genuinely useful, dependency-free conversion.
 */
export function toMarkdown(pages: string[]): string {
  const out: string[] = [];
  pages.forEach((pageText, idx) => {
    if (idx > 0) out.push('\n---\n');
    for (const rawLine of pageText.split('\n')) {
      const line = rawLine.trim();
      if (!line) {
        out.push('');
        continue;
      }
      const isHeading = line.length <= 60 && /[A-Za-z]/.test(line) && line === line.toUpperCase();
      out.push(isHeading ? `## ${line.replace(/\s+/g, ' ')}` : line);
    }
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

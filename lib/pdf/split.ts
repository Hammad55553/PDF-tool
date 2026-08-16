import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { ToolError } from '../api-utils';

export interface SplitOptions {
  /** Split every N pages into its own file. Mutually exclusive with `range`. */
  everyNPages?: number;
  /** Explicit 1-indexed page range, e.g. "1-3" or "2,4,6" to extract into one file. */
  range?: string;
}

interface SplitResult {
  /** If exactly one output file was produced, this is it (no zip needed). */
  single?: { buffer: Buffer; filename: string };
  /** If multiple output files were produced, they're zipped here. */
  zip?: Buffer;
  fileCount: number;
}

function parseRange(range: string, pageCount: number): number[] {
  // Accepts "1-3", "2,4,6", or a mix "1-2,5"
  const indices = new Set<number>();
  const parts = range.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) {
    throw new ToolError('Please provide a valid page range, e.g. "1-3" or "2,4,6".');
  }
  for (const part of parts) {
    const m = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) {
      throw new ToolError(`Invalid range segment: "${part}". Use formats like "1-3" or "5".`);
    }
    const start = parseInt(m[1], 10);
    const end = m[2] ? parseInt(m[2], 10) : start;
    if (start < 1 || end > pageCount || start > end) {
      throw new ToolError(
        `Range "${part}" is out of bounds for a ${pageCount}-page document.`,
      );
    }
    for (let i = start; i <= end; i++) indices.add(i - 1); // 0-indexed
  }
  return Array.from(indices).sort((a, b) => a - b);
}

export async function splitPdf(buf: Buffer, opts: SplitOptions): Promise<SplitResult> {
  let src: PDFDocument;
  try {
    src = await PDFDocument.load(buf);
  } catch {
    throw new ToolError('This file is not a valid or is a password-protected PDF.');
  }

  const pageCount = src.getPageCount();

  // Mode 1: explicit page range -> single output file with just those pages
  if (opts.range) {
    const indices = parseRange(opts.range, pageCount);
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, indices);
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save({ useObjectStreams: true });
    return { single: { buffer: Buffer.from(bytes), filename: 'split.pdf' }, fileCount: 1 };
  }

  // Mode 2: split every N pages into separate files, zipped together
  const n = opts.everyNPages && opts.everyNPages > 0 ? opts.everyNPages : 1;
  const chunks: number[][] = [];
  for (let i = 0; i < pageCount; i += n) {
    const chunk: number[] = [];
    for (let j = i; j < Math.min(i + n, pageCount); j++) chunk.push(j);
    chunks.push(chunk);
  }

  if (chunks.length === 1) {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, chunks[0]);
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save({ useObjectStreams: true });
    return { single: { buffer: Buffer.from(bytes), filename: 'split.pdf' }, fileCount: 1 };
  }

  const zip = new JSZip();
  for (let i = 0; i < chunks.length; i++) {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, chunks[i]);
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save({ useObjectStreams: true });
    const num = String(i + 1).padStart(2, '0');
    zip.file(`part-${num}.pdf`, bytes);
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  return { zip: zipBuffer, fileCount: chunks.length };
}

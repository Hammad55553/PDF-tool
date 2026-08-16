import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';
import { ToolError } from '../api-utils';

async function load(buf: Buffer): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(buf);
  } catch {
    throw new ToolError('This file is not a valid or is a password-protected PDF.');
  }
}

/** Rotate every page by 90 / 180 / 270 degrees (added to existing rotation). */
export async function rotatePdf(buf: Buffer, angle: number): Promise<Buffer> {
  const norm = ((angle % 360) + 360) % 360;
  if (![90, 180, 270].includes(norm)) {
    throw new ToolError('Rotation must be 90, 180 or 270 degrees.');
  }
  const doc = await load(buf);
  for (const page of doc.getPages()) {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + norm) % 360));
  }
  const bytes = await doc.save({ useObjectStreams: true });
  return Buffer.from(bytes);
}

export type PageNumberPosition = 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';

/** Stamp page numbers onto every page. */
export async function addPageNumbers(
  buf: Buffer,
  opts: { position?: PageNumberPosition; startAt?: number } = {},
): Promise<Buffer> {
  const doc = await load(buf);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const position = opts.position ?? 'bottom-center';
  const startAt = opts.startAt && opts.startAt > 0 ? opts.startAt : 1;
  const size = 11;
  const margin = 24;

  const pages = doc.getPages();
  pages.forEach((page, i) => {
    const { width, height } = page.getSize();
    const label = String(startAt + i);
    const textWidth = font.widthOfTextAtSize(label, size);

    let x: number;
    let y: number;
    const isTop = position.startsWith('top');
    y = isTop ? height - margin - size : margin;
    if (position.endsWith('center')) x = (width - textWidth) / 2;
    else if (position.endsWith('right')) x = width - margin - textWidth;
    else x = margin;

    page.drawText(label, { x, y, size, font, color: rgb(0.25, 0.25, 0.25) });
  });

  const bytes = await doc.save({ useObjectStreams: true });
  return Buffer.from(bytes);
}

/** Crop every page inward by the given margins (in points). */
export async function cropPdf(
  buf: Buffer,
  margins: { top?: number; right?: number; bottom?: number; left?: number },
): Promise<Buffer> {
  const doc = await load(buf);
  const t = Math.max(0, margins.top ?? 0);
  const r = Math.max(0, margins.right ?? 0);
  const b = Math.max(0, margins.bottom ?? 0);
  const l = Math.max(0, margins.left ?? 0);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const newW = width - l - r;
    const newH = height - t - b;
    if (newW <= 10 || newH <= 10) {
      throw new ToolError('Crop margins are too large for the page size.');
    }
    // Move the crop/media box origin in by (l, b) and shrink the size.
    page.setCropBox(l, b, newW, newH);
    page.setMediaBox(l, b, newW, newH);
  }

  const bytes = await doc.save({ useObjectStreams: true });
  return Buffer.from(bytes);
}

/**
 * Reorder / delete pages. `order` is a 1-indexed list of the page numbers to
 * keep, in the desired order. e.g. [3,1,2] reorders; [1,2,4] drops page 3.
 */
export async function organizePdf(buf: Buffer, order: number[]): Promise<Buffer> {
  const src = await load(buf);
  const total = src.getPageCount();

  const indices = order
    .map((n) => n - 1)
    .filter((i) => Number.isInteger(i) && i >= 0 && i < total);

  if (indices.length === 0) {
    throw new ToolError('Please provide a valid page order, e.g. "1,3,2".');
  }

  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, indices);
  copied.forEach((p) => out.addPage(p));

  const bytes = await out.save({ useObjectStreams: true });
  return Buffer.from(bytes);
}

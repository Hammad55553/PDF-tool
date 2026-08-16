import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { ToolError } from '../api-utils';

/**
 * Embeds one or more images (JPG/PNG/WEBP) into a single PDF, one image per
 * page, sized to fit an A4-ish page while preserving aspect ratio.
 */
export async function imagesToPdf(images: Buffer[]): Promise<Buffer> {
  if (images.length === 0) {
    throw new ToolError('Please upload at least one image.');
  }

  const doc = await PDFDocument.create();
  const PAGE_WIDTH = 595.28; // A4 at 72dpi
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 24;

  for (const raw of images) {
    let normalized: Buffer;
    let width: number;
    let height: number;

    try {
      // Normalize everything to JPEG via sharp so pdf-lib's embedJpg always
      // works, regardless of the original format (PNG, WEBP, etc).
      const img = sharp(raw).rotate(); // auto-orient using EXIF
      const meta = await img.metadata();
      normalized = await img.jpeg({ quality: 90 }).toBuffer();
      width = meta.width ?? 0;
      height = meta.height ?? 0;
      if (!width || !height) {
        const reMeta = await sharp(normalized).metadata();
        width = reMeta.width ?? 800;
        height = reMeta.height ?? 600;
      }
    } catch {
      throw new ToolError('One of the uploaded files is not a valid image (JPG/PNG/WEBP).');
    }

    const embedded = await doc.embedJpg(normalized);

    const availableWidth = PAGE_WIDTH - MARGIN * 2;
    const availableHeight = PAGE_HEIGHT - MARGIN * 2;
    const scale = Math.min(availableWidth / width, availableHeight / height, 1);
    const drawWidth = width * scale;
    const drawHeight = height * scale;

    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawImage(embedded, {
      x: (PAGE_WIDTH - drawWidth) / 2,
      y: (PAGE_HEIGHT - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    });
  }

  const bytes = await doc.save({ useObjectStreams: true });
  return Buffer.from(bytes);
}

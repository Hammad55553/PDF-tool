import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { ToolError } from '../api-utils';

export type WatermarkPosition =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'diagonal';

export interface WatermarkOptions {
  text: string;
  opacity: number; // 0-1
  position: WatermarkPosition;
  fontSize?: number;
  color?: { r: number; g: number; b: number }; // 0-1 each
}

export async function watermarkPdf(input: Buffer, opts: WatermarkOptions): Promise<Buffer> {
  if (!opts.text || !opts.text.trim()) {
    throw new ToolError('Please enter watermark text.');
  }

  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(input);
  } catch {
    throw new ToolError('This file is not a valid or is a password-protected PDF.');
  }

  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const opacity = Math.min(Math.max(opts.opacity, 0.05), 1);
  const fontSize = opts.fontSize ?? 48;
  const color = opts.color ?? { r: 0.55, g: 0.55, b: 0.55 };

  const pages = doc.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(opts.text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    let x: number;
    let y: number;
    let rotate = 0;

    switch (opts.position) {
      case 'top-left':
        x = 24;
        y = height - textHeight - 24;
        break;
      case 'top-right':
        x = width - textWidth - 24;
        y = height - textHeight - 24;
        break;
      case 'bottom-left':
        x = 24;
        y = 24;
        break;
      case 'bottom-right':
        x = width - textWidth - 24;
        y = 24;
        break;
      case 'diagonal':
        x = (width - textWidth) / 2;
        y = height / 2;
        rotate = 45;
        break;
      case 'center':
      default:
        x = (width - textWidth) / 2;
        y = (height - textHeight) / 2;
        break;
    }

    page.drawText(opts.text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: rotate ? degrees(rotate) : undefined,
    });
  }

  const bytes = await doc.save({ useObjectStreams: true });
  return Buffer.from(bytes);
}

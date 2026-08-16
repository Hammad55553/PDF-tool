import sharp from 'sharp';
import { ToolError } from './api-utils';

type ImgFormat = 'jpeg' | 'png' | 'webp';

function guard<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch(() => {
    throw new ToolError('This image could not be processed. Please upload a valid JPG, PNG or WEBP.');
  });
}

/** Resize to exact width×height, or fit within them keeping aspect ratio. */
export async function resizeImage(
  input: Buffer,
  opts: { width: number; height: number; keepAspect: boolean },
): Promise<Buffer> {
  const w = Math.max(1, Math.round(opts.width));
  const h = Math.max(1, Math.round(opts.height));
  return guard(() =>
    sharp(input)
      .rotate()
      .resize({ width: w, height: h, fit: opts.keepAspect ? 'inside' : 'fill' })
      .toBuffer(),
  );
}

/** Re-encode to shrink file size (JPEG q70 / PNG compress / WEBP q70). */
export async function compressImage(input: Buffer): Promise<Buffer> {
  return guard(async () => {
    const img = sharp(input).rotate();
    const meta = await img.metadata();
    if (meta.format === 'png') return img.png({ compressionLevel: 9, quality: 70 }).toBuffer();
    if (meta.format === 'webp') return img.webp({ quality: 70 }).toBuffer();
    return img.jpeg({ quality: 70, mozjpeg: true }).toBuffer();
  });
}

/** Convert to a target format. */
export async function convertImage(input: Buffer, format: ImgFormat): Promise<Buffer> {
  return guard(() => {
    const img = sharp(input).rotate();
    if (format === 'png') return img.png().toBuffer();
    if (format === 'webp') return img.webp({ quality: 90 }).toBuffer();
    return img.jpeg({ quality: 90 }).toBuffer();
  });
}

/** Rotate by 90 / 180 / 270. */
export async function rotateImage(input: Buffer, angle: number): Promise<Buffer> {
  const norm = ((angle % 360) + 360) % 360;
  if (![90, 180, 270].includes(norm)) throw new ToolError('Rotation must be 90, 180 or 270 degrees.');
  return guard(() => sharp(input).rotate(norm).toBuffer());
}

/** Crop a width×height region from the top-left. */
export async function cropImage(input: Buffer, width: number, height: number): Promise<Buffer> {
  return guard(async () => {
    const img = sharp(input).rotate();
    const meta = await img.metadata();
    const w = Math.min(Math.max(1, Math.round(width)), meta.width ?? width);
    const h = Math.min(Math.max(1, Math.round(height)), meta.height ?? height);
    return img.extract({ left: 0, top: 0, width: w, height: h }).toBuffer();
  });
}

/** Flatten a transparent image onto a solid background color (hex like #ffffff). */
export async function addBackground(input: Buffer, hex: string): Promise<Buffer> {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) throw new ToolError('Please pick a valid color.');
  const int = parseInt(m[1], 16);
  const background = { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255, alpha: 1 };
  return guard(() => sharp(input).rotate().flatten({ background }).png().toBuffer());
}

export const MIME: Record<ImgFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

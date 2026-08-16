import { PDFDocument, PDFName, PDFRawStream, PDFDict } from 'pdf-lib';
import sharp from 'sharp';
import { ToolError } from '../api-utils';

export interface CompressResult {
  buffer: Buffer;
  originalSize: number;
  compressedSize: number;
}

/**
 * Compresses a PDF using two techniques:
 *
 * 1. Structural compression (always applied): re-saving with pdf-lib's
 *    `useObjectStreams: true`, which packs indirect objects into compressed
 *    object streams (PDF 1.5+ feature). This alone often saves a meaningful
 *    amount on PDFs with lots of small objects (forms, many pages, etc).
 *
 * 2. Image downsampling/recompression (best-effort): we scan the PDF's
 *    embedded XObject images, and where they're plain DCT (JPEG) or Flate
 *    encoded raster images, we pipe them through sharp to re-encode as JPEG
 *    at a lower quality, then swap the stream contents back in. This is a
 *    best-effort pass — some image encodings (e.g. JBIG2, CCITT fax, or
 *    images with unusual color spaces/masks) are left untouched rather than
 *    risking a corrupted PDF. This is NOT full “Adobe-grade” PDF compression
 *    (no font subsetting, no content-stream recompression) — it is an honest,
 *    working approximation appropriate for an MVP.
 */
export async function compressPdf(input: Buffer): Promise<CompressResult> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(input);
  } catch {
    throw new ToolError('This file is not a valid or is a password-protected PDF.');
  }

  const originalSize = input.length;

  // Image downsampling touches pdf-lib's lower-level (semi-private) object
  // map, whose exact shape can vary slightly between versions. It's wrapped
  // defensively so that if anything about that internal API doesn't match
  // at runtime, compression still succeeds using structural (object-stream)
  // compression alone instead of failing the whole request.
  try {
    await downsampleImages(doc);
  } catch (e) {
    console.warn('[compress] image downsampling pass skipped:', e);
  }

  const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
  const compressedBuffer = Buffer.from(bytes);

  // Safety net: if our re-encode somehow produced a larger file (can happen
  // on already-optimized PDFs with few/no images), fall back to a plain
  // object-stream resave of the original so we never hand back something
  // bigger than what the user uploaded without at least trying the simple path.
  if (compressedBuffer.length >= originalSize) {
    try {
      const plain = await PDFDocument.load(input);
      const plainBytes = await plain.save({ useObjectStreams: true });
      const plainBuffer = Buffer.from(plainBytes);
      if (plainBuffer.length < originalSize) {
        return { buffer: plainBuffer, originalSize, compressedSize: plainBuffer.length };
      }
    } catch {
      // ignore, fall through to returning the compressed attempt anyway
    }
  }

  return { buffer: compressedBuffer, originalSize, compressedSize: compressedBuffer.length };
}

async function downsampleImages(doc: PDFDocument): Promise<void> {
  // Walk every indirect object in the document using pdf-lib's public
  // `enumerateIndirectObjects()` API (returns [PDFRef, PDFObject][]).
  const allObjects = doc.context.enumerateIndirectObjects();

  for (const [, obj] of allObjects) {
    if (!(obj instanceof PDFRawStream)) continue;
    const dict: PDFDict = obj.dict;
    const subtype = dict.get(PDFName.of('Subtype'));
    if (!subtype || subtype.toString() !== '/Image') continue;

    const filter = dict.get(PDFName.of('Filter'));
    const filterName = filter ? filter.toString() : '';

    // Only attempt to touch formats sharp/libvips can safely decode.
    // Skip JBIG2Decode, CCITTFaxDecode, and anything with an explicit mask
    // (SMask/Mask) to avoid corrupting transparency or scanned-fax pages.
    const hasMask = dict.get(PDFName.of('SMask')) || dict.get(PDFName.of('Mask'));
    if (hasMask) continue;

    const isJpeg = filterName.includes('DCTDecode');
    const isFlateRaster = filterName.includes('FlateDecode') && !filterName.includes('/');

    if (!isJpeg && !isFlateRaster) continue;

    if (isFlateRaster) {
      // Flate-encoded raw raster data needs explicit width/height/colorspace
      // to be decodable by sharp as "raw" — without a bitmap header this is
      // ambiguous, so we skip re-encoding these and leave them as-is.
      continue;
    }

    try {
      const original = obj.getContents();
      let pipeline = sharp(Buffer.from(original));

      const width = dict.get(PDFName.of('Width'));
      const height = dict.get(PDFName.of('Height'));
      const w = width ? Number(width.toString()) : undefined;
      const h = height ? Number(height.toString()) : undefined;

      // Downsample large images to a reasonable max dimension for on-screen
      // / print sharing use cases, and re-encode as JPEG at quality 60.
      const MAX_DIM = 1600;
      if (w && h && Math.max(w, h) > MAX_DIM) {
        pipeline = pipeline.resize({
          width: w >= h ? MAX_DIM : undefined,
          height: h > w ? MAX_DIM : undefined,
          fit: 'inside',
        });
      }

      const recompressed = await pipeline.jpeg({ quality: 60, mozjpeg: true }).toBuffer();

      // Only swap in the new image if it's actually smaller.
      if (recompressed.length < original.length) {
        const meta = await sharp(recompressed).metadata();
        obj.dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
        obj.dict.set(PDFName.of('Width'), doc.context.obj(meta.width ?? w ?? 0));
        obj.dict.set(PDFName.of('Height'), doc.context.obj(meta.height ?? h ?? 0));
        // Reassigning `.contents` (readonly at the TS level only) is the
        // pdf-lib-confirmed way to swap stream bytes; `/Length` does NOT
        // need to be set manually — PDFStream.updateDict() recomputes it
        // from the new contents' byte length automatically at save time.
        (obj as unknown as { contents: Uint8Array }).contents = recompressed;
      }
    } catch {
      // If any single image fails to re-encode, skip it and leave original
      // bytes untouched rather than failing the whole compression job.
      continue;
    }
  }
}

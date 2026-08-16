import { PDFDocument } from 'pdf-lib';
import { ToolError } from '../api-utils';

/**
 * Merges multiple PDF buffers, in the given order, into a single PDF buffer.
 */
export async function mergePdfs(buffers: Buffer[]): Promise<Buffer> {
  if (buffers.length < 2) {
    throw new ToolError('Please upload at least 2 PDF files to merge.');
  }

  const merged = await PDFDocument.create();

  for (const buf of buffers) {
    let src: PDFDocument;
    try {
      src = await PDFDocument.load(buf, { ignoreEncryption: false });
    } catch {
      throw new ToolError(
        'One of the uploaded files is not a valid or is a password-protected PDF. Unlock it first, then try again.',
      );
    }
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }

  const bytes = await merged.save({ useObjectStreams: true });
  return Buffer.from(bytes);
}

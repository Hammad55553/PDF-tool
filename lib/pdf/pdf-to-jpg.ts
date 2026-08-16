import JSZip from 'jszip';
import path from 'node:path';
import { ToolError } from '../api-utils';

/**
 * Rasterizes every page of a PDF to a JPG using `pdfjs-dist` (Mozilla's PDF
 * renderer, the same engine behind Firefox's built-in PDF viewer) combined
 * with the `canvas` package for a server-side (Node) <canvas> implementation.
 *
 * Why this approach instead of poppler's `pdftoppm`: poppler-utils is a
 * system package (apt/brew) that may not be present on every host (including
 * the sandbox this project was generated in), whereas pdfjs-dist + canvas are
 * pure npm dependencies that work anywhere Node + native build tools are
 * available. If you deploy to a host where `pdftoppm` IS available and want
 * faster/lighter rendering, you can swap this module out for a
 * `child_process` call to `pdftoppm` — the rest of the app doesn't need to
 * change (this module's exported function signature is the only contract).
 *
 * IMPORTANT implementation detail: pdfjs-dist's Node ("legacy") build does
 * NOT work correctly if you just hand it a bare node-canvas 2D context via
 * `page.render({ canvasContext })`. Internally, pdf.js also creates its own
 * *scratch* canvases (e.g. for image masks/patterns) through whatever
 * `canvasFactory` was passed to `getDocument()` — if you don't supply one,
 * it falls back to a browser-oriented factory that assumes `document.
 * createElement('canvas')` exists, which throws (or worse, can crash the
 * Node process) in a server environment. The `NodeCanvasFactory` class below
 * is Mozilla's own documented pattern for Node usage (see pdf.js repo,
 * examples/node/pdf2png/pdf2png.js) and is required, not optional.
 *
 * NOTE: `canvas` is a native addon (compiles against Cairo/Pango/libjpeg).
 * On some hosts (notably some serverless platforms) it may need extra
 * system libraries at deploy time. See README "PDF to JPG setup notes".
 */
export interface PdfToJpgResult {
  zip: Buffer;
  pageCount: number;
}

// Minimal structural type for what pdf.js expects from a canvas/context pair.
// We avoid importing `canvas`'s types directly here since this file needs
// to stay import-order-safe with the dynamic `await import('canvas')` below.
interface CanvasAndContext {
  canvas: any;
  context: any;
}

class NodeCanvasFactory {
  private createCanvasFn: (width: number, height: number) => any;

  constructor(createCanvasFn: (width: number, height: number) => any) {
    this.createCanvasFn = createCanvasFn;
  }

  create(width: number, height: number): CanvasAndContext {
    if (width <= 0 || height <= 0) {
      throw new Error('Invalid canvas size');
    }
    const canvas = this.createCanvasFn(width, height);
    const context = canvas.getContext('2d');
    return { canvas, context };
  }

  reset(canvasAndContext: CanvasAndContext, width: number, height: number): void {
    if (!canvasAndContext.canvas) throw new Error('Canvas is not specified');
    if (width <= 0 || height <= 0) throw new Error('Invalid canvas size');
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext: CanvasAndContext): void {
    if (!canvasAndContext.canvas) throw new Error('Canvas is not specified');
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

export async function pdfToJpg(input: Buffer, quality = 85, scale = 2): Promise<PdfToJpgResult> {
  throw new ToolError('PDF to JPG is temporarily disabled due to Vercel deployment issues.');
}

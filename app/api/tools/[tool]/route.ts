import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, fileToBuffer, getFiles, ToolError } from '@/lib/api-utils';
import { checkPlanLimits, type Plan } from '@/lib/plan';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { mergePdfs } from '@/lib/pdf/merge';
import { splitPdf } from '@/lib/pdf/split';
import { compressPdf } from '@/lib/pdf/compress';
import { watermarkPdf, WatermarkPosition } from '@/lib/pdf/watermark';
import { protectPdf, unlockPdf } from '@/lib/pdf/protect';
import { imagesToPdf } from '@/lib/pdf/image-to-pdf';
import { pdfToJpg } from '@/lib/pdf/pdf-to-jpg';
import { removeBackground } from '@/lib/remove-background';
import { convertWithLibreOffice } from '@/lib/office-convert';
import {
  rotatePdf,
  addPageNumbers,
  cropPdf,
  organizePdf,
  type PageNumberPosition,
} from '@/lib/pdf/transform';
import { resizeImage, compressImage, convertImage, rotateImage, cropImage, addBackground, MIME } from '@/lib/image-tools';
import { extractPdfText, toPlainText, toMarkdown } from '@/lib/pdf/extract-text';
import { PDFDocument } from 'pdf-lib';

// Maps each office-conversion tool slug to: the input file extension we save
// the upload as, the LibreOffice output format, the download filename, and
// the download MIME type. Driven by lib/office-convert.ts (`soffice`).
const OFFICE_CONVERSIONS: Record<
  string,
  { inputExt: string; outputFormat: string; filename: string; contentType: string }
> = {
  'pdf-to-word': {
    inputExt: 'pdf',
    outputFormat: 'docx',
    filename: 'converted.docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  'word-to-pdf': { inputExt: 'docx', outputFormat: 'pdf', filename: 'converted.pdf', contentType: 'application/pdf' },
  'pdf-to-excel': {
    inputExt: 'pdf',
    outputFormat: 'xlsx',
    filename: 'converted.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  'excel-to-pdf': { inputExt: 'xlsx', outputFormat: 'pdf', filename: 'converted.pdf', contentType: 'application/pdf' },
  'ppt-to-pdf': { inputExt: 'pptx', outputFormat: 'pdf', filename: 'converted.pdf', contentType: 'application/pdf' },
  'pdf-to-powerpoint': {
    inputExt: 'pdf',
    outputFormat: 'pptx',
    filename: 'converted.pptx',
    contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  },
};

// Slugs that are UI-only "coming soon" (no backend yet).
const COMING_SOON = new Set([
  'repair-pdf',
  'ocr-pdf',
  'html-to-pdf',
  'pdf-to-pdfa',
  'edit-pdf',
  'ai-summarize',
  'translate-pdf',
  'compare-pdf',
  'sign-pdf',
  'redact-pdf',
  'watermark-remover-image',
  'upscale-image',
  'blur-face',
  'video-watermark-remover',
  'compress-video',
  'video-to-gif',
  'trim-video',
]);

// These tools do real file processing with Node-only libraries (sharp,
// pdf-lib, canvas, child_process for qpdf/rembg) so this route must run on
// the Node.js runtime, not the Edge runtime.
export const runtime = 'nodejs';
// File processing can take a few seconds for larger PDFs/rasterization.
export const maxDuration = 300;

/**
 * Resolves the caller's real plan from their Supabase session cookie — NOT
 * from a client-sent header, which anyone could fake with devtools. Signed
 * out or no matching pdfkit_users row => 'free'.
 */
async function resolveRealPlan(): Promise<Plan> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 'free';

  const { data } = await supabase.from('pdfkit_users').select('plan').eq('id', user.id).maybeSingle();
  if (data?.plan === 'pro' || data?.plan === 'ultra') return data.plan;
  return 'free';
}

export async function POST(req: NextRequest, { params }: { params: { tool: string } }) {
  const tool = params.tool;

  try {
    const form = await req.formData();
    const plan = await resolveRealPlan();

    switch (tool) {
      case 'merge-pdf': {
        const files = getFiles(form, 'files');
        const buffers = await Promise.all(files.map(fileToBuffer));
        const check = checkPlanLimits({ plan, fileSizesBytes: buffers.map((b) => b.length) });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const merged = await mergePdfs(buffers);

        return fileResponse(merged, 'merged.pdf', 'application/pdf');
      }

      case 'split-pdf': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload a PDF file.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const range = form.get('range')?.toString() || undefined;
        const everyNPagesRaw = form.get('everyNPages')?.toString();
        const everyNPages = everyNPagesRaw ? parseInt(everyNPagesRaw, 10) : undefined;

        const srcDoc = await PDFDocument.load(buffer).catch(() => {
          throw new ToolError('This file is not a valid or is a password-protected PDF.');
        });
        const pageCheck = checkPlanLimits({
          plan,
          fileSizesBytes: [buffer.length],
          pageCount: srcDoc.getPageCount(),
        });
        if (!pageCheck.allowed) throw new ToolError(pageCheck.message!, 402);

        const result = await splitPdf(buffer, { range, everyNPages });
        if (result.single) {
          return fileResponse(result.single.buffer, result.single.filename, 'application/pdf');
        }
        return fileResponse(result.zip!, 'split-pages.zip', 'application/zip');
      }

      case 'compress-pdf': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload a PDF file.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const result = await compressPdf(buffer);
        const res = fileResponse(result.buffer, 'compressed.pdf', 'application/pdf');
        res.headers.set('X-Original-Size', String(result.originalSize));
        res.headers.set('X-Compressed-Size', String(result.compressedSize));
        return res;
      }

      case 'jpg-to-pdf': {
        const files = getFiles(form, 'files');
        const buffers = await Promise.all(files.map(fileToBuffer));
        const check = checkPlanLimits({ plan, fileSizesBytes: buffers.map((b) => b.length) });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const pdf = await imagesToPdf(buffers);
        return fileResponse(pdf, 'images.pdf', 'application/pdf');
      }

      case 'pdf-to-jpg': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload a PDF file.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const result = await pdfToJpg(buffer);
        return fileResponse(result.zip, 'pdf-pages.zip', 'application/zip');
      }

      case 'watermark-pdf': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload a PDF file.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const text = form.get('text')?.toString() || 'CONFIDENTIAL';
        const opacity = parseFloat(form.get('opacity')?.toString() || '0.3');
        const position = (form.get('position')?.toString() || 'center') as WatermarkPosition;

        const result = await watermarkPdf(buffer, { text, opacity, position });
        return fileResponse(result, 'watermarked.pdf', 'application/pdf');
      }

      case 'protect-pdf': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload a PDF file.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const password = form.get('password')?.toString() || '';
        const result = await protectPdf(buffer, password);
        const res = fileResponse(result.buffer, 'protected.pdf', 'application/pdf');
        res.headers.set('X-Real-Encryption', String(result.realEncryption));
        res.headers.set('X-Note', encodeURIComponent(result.note));
        return res;
      }

      case 'unlock-pdf': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload a PDF file.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const password = form.get('password')?.toString() || '';
        const result = await unlockPdf(buffer, password);
        return fileResponse(result, 'unlocked.pdf', 'application/pdf');
      }

      case 'remove-background': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload an image.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const result = await removeBackground(buffer);
        return fileResponse(result, 'background-removed.png', 'image/png');
      }

      // Office conversions (PDF<->Word/Excel/PowerPoint) via LibreOffice's
      // headless `soffice`. If LibreOffice isn't installed on the server,
      // convertWithLibreOffice throws a clear 503 with setup instructions.
      case 'pdf-to-word':
      case 'word-to-pdf':
      case 'pdf-to-excel':
      case 'excel-to-pdf':
      case 'ppt-to-pdf':
      case 'pdf-to-powerpoint': {
        const conv = OFFICE_CONVERSIONS[tool];
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload a file to convert.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const output = await convertWithLibreOffice(buffer, conv.inputExt, conv.outputFormat);
        return fileResponse(output, conv.filename, conv.contentType);
      }

      case 'rotate-pdf': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload a PDF file.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const angle = parseInt(form.get('angle')?.toString() || '90', 10);
        const result = await rotatePdf(buffer, angle);
        return fileResponse(result, 'rotated.pdf', 'application/pdf');
      }

      case 'page-numbers': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload a PDF file.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const position = (form.get('position')?.toString() || 'bottom-center') as PageNumberPosition;
        const startAt = parseInt(form.get('startAt')?.toString() || '1', 10);
        const result = await addPageNumbers(buffer, { position, startAt });
        return fileResponse(result, 'numbered.pdf', 'application/pdf');
      }

      case 'crop-pdf': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload a PDF file.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const m = parseInt(form.get('margin')?.toString() || '20', 10);
        const result = await cropPdf(buffer, { top: m, right: m, bottom: m, left: m });
        return fileResponse(result, 'cropped.pdf', 'application/pdf');
      }

      case 'organize-pdf': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload a PDF file.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const order = (form.get('order')?.toString() || '')
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !Number.isNaN(n));
        if (order.length === 0) throw new ToolError('Enter the page order, e.g. "1,3,2".');
        const result = await organizePdf(buffer, order);
        return fileResponse(result, 'organized.pdf', 'application/pdf');
      }

      case 'resize-image': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload an image.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const width = parseInt(form.get('width')?.toString() || '800', 10);
        const height = parseInt(form.get('height')?.toString() || '600', 10);
        const keepAspect = form.get('keepAspect')?.toString() === '1';
        const result = await resizeImage(buffer, { width, height, keepAspect });
        return fileResponse(result, 'resized.png', 'image/png');
      }

      case 'compress-image': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload an image.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const result = await compressImage(buffer);
        const res = fileResponse(result, 'compressed-image', 'image/jpeg');
        res.headers.set('X-Original-Size', String(buffer.length));
        res.headers.set('X-Compressed-Size', String(result.length));
        return res;
      }

      case 'convert-image': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload an image.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const fmt = (form.get('format')?.toString() || 'png') as 'jpeg' | 'png' | 'webp';
        const result = await convertImage(buffer, fmt);
        return fileResponse(result, `converted.${fmt === 'jpeg' ? 'jpg' : fmt}`, MIME[fmt]);
      }

      case 'rotate-image': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload an image.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const angle = parseInt(form.get('angle')?.toString() || '90', 10);
        const result = await rotateImage(buffer, angle);
        return fileResponse(result, 'rotated-image.png', 'image/png');
      }

      case 'crop-image': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload an image.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const width = parseInt(form.get('width')?.toString() || '400', 10);
        const height = parseInt(form.get('height')?.toString() || '400', 10);
        const result = await cropImage(buffer, width, height);
        return fileResponse(result, 'cropped-image.png', 'image/png');
      }

      case 'add-background': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload a transparent PNG image.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const color = form.get('bgColor')?.toString() || '#ffffff';
        const result = await addBackground(buffer, color);
        return fileResponse(result, 'with-background.png', 'image/png');
      }

      case 'pdf-to-text': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload a PDF file.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const pages = await extractPdfText(buffer);
        const text = toPlainText(pages);
        return fileResponse(Buffer.from(text, 'utf8'), 'extracted.txt', 'text/plain; charset=utf-8');
      }

      case 'pdf-to-markdown': {
        const files = getFiles(form, 'file');
        if (files.length === 0) throw new ToolError('Please upload a PDF file.');
        const buffer = await fileToBuffer(files[0]);
        const check = checkPlanLimits({ plan, fileSizesBytes: [buffer.length] });
        if (!check.allowed) throw new ToolError(check.message!, 402);

        const pages = await extractPdfText(buffer);
        const md = toMarkdown(pages);
        return fileResponse(Buffer.from(md, 'utf8'), 'converted.md', 'text/markdown; charset=utf-8');
      }

      default:
        if (COMING_SOON.has(tool)) {
          throw new ToolError('This tool is coming soon.', 501);
        }
        throw new ToolError('Unknown tool.', 404);
    }
  } catch (err) {
    return errorResponse(err);
  }
}

function fileResponse(buffer: Buffer, filename: string, contentType: string): NextResponse {
  // NextResponse's BodyInit typing doesn't include Node's Buffer directly,
  // even though it works fine at runtime. Casting through Uint8Array keeps
  // this correct for both `tsc` and the actual Node HTTP response.
  const body = new Uint8Array(buffer);
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    },
  });
}

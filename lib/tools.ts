/**
 * lib/tools.ts
 *
 * Single source of truth for the tool catalog shown on the landing page
 * and used to render each /tools/[tool] page. Add a new tool by adding
 * an entry here plus a matching case in app/api/tools/[tool]/route.ts.
 */

export type ToolCategory =
  | 'organize'
  | 'optimize'
  | 'convert'
  | 'edit'
  | 'security'
  | 'intelligence'
  | 'image'
  | 'video';

export interface ToolCategoryDef {
  key: ToolCategory;
  label: string;
}

/** Category tabs shown on the homepage + header, in display order. */
export const CATEGORIES: ToolCategoryDef[] = [
  { key: 'organize', label: 'Organize PDF' },
  { key: 'optimize', label: 'Optimize PDF' },
  { key: 'convert', label: 'Convert PDF' },
  { key: 'edit', label: 'Edit PDF' },
  { key: 'security', label: 'PDF Security' },
  { key: 'intelligence', label: 'PDF Intelligence' },
  { key: 'image', label: 'Image Tools' },
  { key: 'video', label: 'Video Tools' },
];

export interface ToolDef {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: ToolCategory;
  /** Lucide icon name (kebab of the exported component). See components/ToolIcon.tsx */
  icon: string;
  /** Tailwind text/background color pair for the icon tile, e.g. brand color. */
  color: string; // e.g. 'text-rose-600 bg-rose-50'
  accept: string; // input[accept] value
  multiple: boolean;
  /** Fully working (real processing) vs UI-only "coming soon" stub. */
  status: 'live' | 'coming-soon';
  badge?: string;
}

export const TOOLS: ToolDef[] = [
  // ---------------- Organize ----------------
  {
    slug: 'merge-pdf',
    name: 'Merge PDF',
    shortDescription: 'Combine PDFs in the order you want.',
    description:
      'Upload two or more PDF files and merge them into a single document, in the order you arrange them.',
    category: 'organize',
    icon: 'copy-plus',
    color: 'text-rose-600 bg-rose-50',
    accept: 'application/pdf',
    multiple: true,
    status: 'live',
  },
  {
    slug: 'split-pdf',
    name: 'Split PDF',
    shortDescription: 'Extract pages or split into multiple files.',
    description:
      'Upload a PDF and split it by a page range or every N pages. Multiple outputs are bundled into a ZIP.',
    category: 'organize',
    icon: 'scissors-line-dashed',
    color: 'text-rose-600 bg-rose-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'live',
  },

  // ---------------- Optimize ----------------
  {
    slug: 'compress-pdf',
    name: 'Compress PDF',
    shortDescription: 'Shrink PDF file size for easy sharing.',
    description:
      'Re-save your PDF with object-stream compression and optional image downsampling to reduce file size.',
    category: 'optimize',
    icon: 'minimize-2',
    color: 'text-emerald-600 bg-emerald-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'live',
  },

  // ---------------- Convert ----------------
  {
    slug: 'jpg-to-pdf',
    name: 'JPG to PDF',
    shortDescription: 'Turn images into a single PDF.',
    description: 'Upload one or more JPG/PNG images and combine them into a single PDF document.',
    category: 'convert',
    icon: 'image',
    color: 'text-amber-600 bg-amber-50',
    accept: 'image/jpeg,image/png,image/webp',
    multiple: true,
    status: 'live',
  },
  {
    slug: 'pdf-to-jpg',
    name: 'PDF to JPG',
    shortDescription: 'Turn each PDF page into a JPG image.',
    description: 'Upload a PDF and get every page rasterized to a high-quality JPG, bundled as a ZIP.',
    category: 'convert',
    icon: 'file-image',
    color: 'text-amber-600 bg-amber-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'live',
  },
  {
    slug: 'pdf-to-word',
    name: 'PDF to Word',
    shortDescription: 'Convert PDF pages to an editable DOCX.',
    description:
      'Convert a PDF to an editable Word document. Uses a LibreOffice conversion backend on the server.',
    category: 'convert',
    icon: 'file-type',
    color: 'text-blue-600 bg-blue-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'live',
  },
  {
    slug: 'word-to-pdf',
    name: 'Word to PDF',
    shortDescription: 'Convert DOCX files to PDF.',
    description: 'Convert a Word document to PDF. Uses a LibreOffice conversion backend on the server.',
    category: 'convert',
    icon: 'file-type',
    color: 'text-blue-600 bg-blue-50',
    accept: '.doc,.docx',
    multiple: false,
    status: 'live',
  },
  {
    slug: 'pdf-to-excel',
    name: 'PDF to Excel',
    shortDescription: 'Extract tables into a spreadsheet.',
    description:
      'Convert tabular data in a PDF into an editable Excel spreadsheet. Uses a LibreOffice conversion backend.',
    category: 'convert',
    icon: 'file-spreadsheet',
    color: 'text-green-600 bg-green-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'live',
  },
  {
    slug: 'excel-to-pdf',
    name: 'Excel to PDF',
    shortDescription: 'Convert spreadsheets to PDF.',
    description: 'Convert an Excel spreadsheet to PDF. Uses a LibreOffice conversion backend.',
    category: 'convert',
    icon: 'file-spreadsheet',
    color: 'text-green-600 bg-green-50',
    accept: '.xls,.xlsx',
    multiple: false,
    status: 'live',
  },
  {
    slug: 'ppt-to-pdf',
    name: 'PowerPoint to PDF',
    shortDescription: 'Convert slide decks to PDF.',
    description: 'Convert a PowerPoint presentation to PDF. Uses a LibreOffice conversion backend.',
    category: 'convert',
    icon: 'presentation',
    color: 'text-orange-600 bg-orange-50',
    accept: '.ppt,.pptx',
    multiple: false,
    status: 'live',
  },

  // ---------------- Edit ----------------
  {
    slug: 'watermark-pdf',
    name: 'Watermark PDF',
    shortDescription: 'Stamp text over every page.',
    description: 'Add a configurable text watermark (text, opacity, position) across every page of your PDF.',
    category: 'edit',
    icon: 'stamp',
    color: 'text-violet-600 bg-violet-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'live',
  },
  {
    slug: 'remove-background',
    name: 'Background Remover',
    shortDescription: 'Cut out the background from any photo.',
    description:
      'Upload a photo and automatically remove the background using the rembg AI model, returning a transparent PNG.',
    category: 'edit',
    icon: 'eraser',
    color: 'text-violet-600 bg-violet-50',
    accept: 'image/jpeg,image/png,image/webp',
    multiple: false,
    status: 'live',
    badge: 'AI',
  },

  // ---------------- Security ----------------
  {
    slug: 'protect-pdf',
    name: 'Protect PDF',
    shortDescription: 'Add a password to your PDF.',
    description:
      'Add password protection to a PDF. See the in-app note about current encryption strength limitations.',
    category: 'security',
    icon: 'lock',
    color: 'text-sky-600 bg-sky-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'live',
  },
  {
    slug: 'unlock-pdf',
    name: 'Unlock PDF',
    shortDescription: 'Remove a known password from a PDF.',
    description: 'Remove password protection from a PDF when you already know the password.',
    category: 'security',
    icon: 'lock-open',
    color: 'text-sky-600 bg-sky-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'live',
  },

  // ---------------- Organize (more) ----------------
  {
    slug: 'organize-pdf',
    name: 'Organize PDF',
    shortDescription: 'Reorder or delete pages.',
    description: 'Reorder the pages of your PDF, or delete pages you no longer need, then download the result.',
    category: 'organize',
    icon: 'layout-grid',
    color: 'text-rose-600 bg-rose-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'live',
  },
  {
    slug: 'rotate-pdf',
    name: 'Rotate PDF',
    shortDescription: 'Rotate all pages 90/180/270°.',
    description: 'Rotate every page of your PDF by 90, 180 or 270 degrees and download the rotated file.',
    category: 'organize',
    icon: 'rotate-cw',
    color: 'text-rose-600 bg-rose-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'live',
  },

  // ---------------- Optimize (more) ----------------
  {
    slug: 'repair-pdf',
    name: 'Repair PDF',
    shortDescription: 'Recover a damaged PDF.',
    description: 'Attempt to repair a corrupted or damaged PDF and recover as much content as possible.',
    category: 'optimize',
    icon: 'wrench',
    color: 'text-emerald-600 bg-emerald-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'coming-soon',
  },
  {
    slug: 'ocr-pdf',
    name: 'OCR PDF',
    shortDescription: 'Make scanned PDFs searchable.',
    description: 'Run OCR on a scanned PDF to make its text searchable and selectable.',
    category: 'intelligence',
    icon: 'scan-text',
    color: 'text-fuchsia-600 bg-fuchsia-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'coming-soon',
    badge: 'AI',
  },

  // ---------------- Convert (more) ----------------
  {
    slug: 'pdf-to-powerpoint',
    name: 'PDF to PowerPoint',
    shortDescription: 'Convert PDF to editable slides.',
    description: 'Convert a PDF into an editable PowerPoint (PPTX). Uses a LibreOffice conversion backend.',
    category: 'convert',
    icon: 'presentation',
    color: 'text-orange-600 bg-orange-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'live',
  },
  {
    slug: 'html-to-pdf',
    name: 'HTML to PDF',
    shortDescription: 'Turn a web page into a PDF.',
    description: 'Paste a web page URL and convert it to a clean PDF document.',
    category: 'convert',
    icon: 'globe',
    color: 'text-amber-600 bg-amber-50',
    accept: '',
    multiple: false,
    status: 'coming-soon',
  },
  {
    slug: 'pdf-to-pdfa',
    name: 'PDF to PDF/A',
    shortDescription: 'Convert to the archival PDF/A format.',
    description: 'Convert your PDF to PDF/A, the ISO-standardized format for long-term archiving.',
    category: 'convert',
    icon: 'archive',
    color: 'text-blue-600 bg-blue-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'coming-soon',
  },
  {
    slug: 'pdf-to-markdown',
    name: 'PDF to Markdown',
    shortDescription: 'Turn PDFs into Markdown.',
    description: 'Convert a PDF into Markdown — great for notes, docs and LLMs. Headings and paragraphs preserved.',
    category: 'intelligence',
    icon: 'file-code',
    color: 'text-fuchsia-600 bg-fuchsia-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'live',
    badge: 'New',
  },
  {
    slug: 'pdf-to-text',
    name: 'PDF to Text',
    shortDescription: 'Extract plain text from a PDF.',
    description: 'Pull all the selectable text out of a PDF into a plain .txt file.',
    category: 'intelligence',
    icon: 'file-text',
    color: 'text-fuchsia-600 bg-fuchsia-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'live',
  },

  // ---------------- Edit (more) ----------------
  {
    slug: 'edit-pdf',
    name: 'Edit PDF',
    shortDescription: 'Add text, images and shapes.',
    description: 'Add text, images, shapes or freehand annotations to a PDF and edit their size, font and color.',
    category: 'edit',
    icon: 'pencil',
    color: 'text-violet-600 bg-violet-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'coming-soon',
  },
  {
    slug: 'page-numbers',
    name: 'Page Numbers',
    shortDescription: 'Add page numbers to a PDF.',
    description: 'Add page numbers to your PDF — choose the position and starting number.',
    category: 'edit',
    icon: 'hash',
    color: 'text-violet-600 bg-violet-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'live',
  },
  {
    slug: 'crop-pdf',
    name: 'Crop PDF',
    shortDescription: 'Trim the margins of a PDF.',
    description: 'Crop the margins of every page in your PDF by a chosen amount.',
    category: 'edit',
    icon: 'crop',
    color: 'text-violet-600 bg-violet-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'live',
  },
  {
    slug: 'ai-summarize',
    name: 'AI Summarizer',
    shortDescription: 'Summarize a PDF with AI.',
    description: 'Generate a concise summary of a PDF document with AI.',
    category: 'intelligence',
    icon: 'sparkles',
    color: 'text-fuchsia-600 bg-fuchsia-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'coming-soon',
    badge: 'AI',
  },
  {
    slug: 'translate-pdf',
    name: 'Translate PDF',
    shortDescription: 'Translate a PDF, keep the layout.',
    description: 'Translate a PDF into another language with AI while keeping fonts and layout intact.',
    category: 'intelligence',
    icon: 'languages',
    color: 'text-fuchsia-600 bg-fuchsia-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'coming-soon',
    badge: 'AI',
  },
  {
    slug: 'compare-pdf',
    name: 'Compare PDF',
    shortDescription: 'Spot changes between two PDFs.',
    description: 'Compare two PDF versions side by side and highlight the differences.',
    category: 'intelligence',
    icon: 'git-compare',
    color: 'text-fuchsia-600 bg-fuchsia-50',
    accept: 'application/pdf',
    multiple: true,
    status: 'coming-soon',
  },

  // ---------------- Security (more) ----------------
  {
    slug: 'sign-pdf',
    name: 'Sign PDF',
    shortDescription: 'Sign or request signatures.',
    description: 'Add your signature to a PDF, or request electronic signatures from others.',
    category: 'security',
    icon: 'pen-tool',
    color: 'text-sky-600 bg-sky-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'coming-soon',
  },
  {
    slug: 'redact-pdf',
    name: 'Redact PDF',
    shortDescription: 'Permanently remove sensitive info.',
    description: 'Redact text and graphics to permanently remove sensitive information from a PDF.',
    category: 'security',
    icon: 'square-slash',
    color: 'text-sky-600 bg-sky-50',
    accept: 'application/pdf',
    multiple: false,
    status: 'coming-soon',
  },

  // ---------------- Image tools ----------------
  {
    slug: 'resize-image',
    name: 'Resize Image',
    shortDescription: 'Resize an image to exact pixels.',
    description: 'Resize a JPG, PNG or WEBP image to an exact width and height (or keep the aspect ratio).',
    category: 'image',
    icon: 'scaling',
    color: 'text-teal-600 bg-teal-50',
    accept: 'image/jpeg,image/png,image/webp',
    multiple: false,
    status: 'live',
  },
  {
    slug: 'compress-image',
    name: 'Compress Image',
    shortDescription: 'Shrink image file size.',
    description: 'Reduce the file size of a JPG, PNG or WEBP image while keeping good quality.',
    category: 'image',
    icon: 'image-minus',
    color: 'text-teal-600 bg-teal-50',
    accept: 'image/jpeg,image/png,image/webp',
    multiple: false,
    status: 'live',
  },
  {
    slug: 'convert-image',
    name: 'Convert Image',
    shortDescription: 'JPG ↔ PNG ↔ WEBP.',
    description: 'Convert an image between JPG, PNG and WEBP formats.',
    category: 'image',
    icon: 'image',
    color: 'text-teal-600 bg-teal-50',
    accept: 'image/jpeg,image/png,image/webp',
    multiple: false,
    status: 'live',
  },
  {
    slug: 'rotate-image',
    name: 'Rotate Image',
    shortDescription: 'Rotate an image 90/180/270°.',
    description: 'Rotate a JPG, PNG or WEBP image by 90, 180 or 270 degrees.',
    category: 'image',
    icon: 'rotate-cw',
    color: 'text-teal-600 bg-teal-50',
    accept: 'image/jpeg,image/png,image/webp',
    multiple: false,
    status: 'live',
  },
  {
    slug: 'crop-image',
    name: 'Crop Image',
    shortDescription: 'Crop an image to a size.',
    description: 'Crop a JPG, PNG or WEBP image to a chosen width and height from the top-left.',
    category: 'image',
    icon: 'crop',
    color: 'text-teal-600 bg-teal-50',
    accept: 'image/jpeg,image/png,image/webp',
    multiple: false,
    status: 'live',
  },
  {
    slug: 'watermark-remover-image',
    name: 'Image Watermark Remover',
    shortDescription: 'Remove watermarks from an image.',
    description:
      'Remove watermarks or logos from your own images using AI inpainting. Only remove watermarks from content you own or have the right to edit.',
    category: 'image',
    icon: 'wand',
    color: 'text-teal-600 bg-teal-50',
    accept: 'image/jpeg,image/png,image/webp',
    multiple: false,
    status: 'coming-soon',
    badge: 'AI',
  },
  {
    slug: 'upscale-image',
    name: 'Upscale Image',
    shortDescription: 'Enlarge images with AI.',
    description: 'Increase image resolution and sharpness with AI upscaling, without losing quality.',
    category: 'image',
    icon: 'scaling',
    color: 'text-teal-600 bg-teal-50',
    accept: 'image/jpeg,image/png,image/webp',
    multiple: false,
    status: 'coming-soon',
    badge: 'AI',
  },
  {
    slug: 'blur-face',
    name: 'Blur Face',
    shortDescription: 'Blur faces in a photo.',
    description: 'Automatically detect and blur faces in a photo to protect privacy.',
    category: 'image',
    icon: 'eraser',
    color: 'text-teal-600 bg-teal-50',
    accept: 'image/jpeg,image/png,image/webp',
    multiple: false,
    status: 'coming-soon',
    badge: 'AI',
  },
  {
    slug: 'add-background',
    name: 'Add Background Color',
    shortDescription: 'Fill a transparent image background.',
    description:
      'Add a solid background color behind a transparent (PNG) image — great after using the Background Remover.',
    category: 'image',
    icon: 'palette',
    color: 'text-teal-600 bg-teal-50',
    accept: 'image/png,image/webp',
    multiple: false,
    status: 'live',
  },

  // ---------------- Video tools ----------------
  {
    slug: 'video-watermark-remover',
    name: 'Video Watermark Remover',
    shortDescription: 'Remove watermarks from a video.',
    description:
      'Remove watermarks or logos from your own videos. Only remove watermarks from content you own or have the right to edit.',
    category: 'video',
    icon: 'wand',
    color: 'text-indigo-600 bg-indigo-50',
    accept: 'video/mp4,video/quicktime,video/webm',
    multiple: false,
    status: 'coming-soon',
    badge: 'AI',
  },
  {
    slug: 'compress-video',
    name: 'Compress Video',
    shortDescription: 'Shrink video file size.',
    description: 'Reduce the file size of an MP4, MOV or WEBM video while keeping good quality.',
    category: 'video',
    icon: 'minimize-2',
    color: 'text-indigo-600 bg-indigo-50',
    accept: 'video/mp4,video/quicktime,video/webm',
    multiple: false,
    status: 'coming-soon',
  },
  {
    slug: 'video-to-gif',
    name: 'Video to GIF',
    shortDescription: 'Turn a video into a GIF.',
    description: 'Convert a short video clip into an animated GIF.',
    category: 'video',
    icon: 'film',
    color: 'text-indigo-600 bg-indigo-50',
    accept: 'video/mp4,video/quicktime,video/webm',
    multiple: false,
    status: 'coming-soon',
  },
  {
    slug: 'trim-video',
    name: 'Trim Video',
    shortDescription: 'Cut a clip from a video.',
    description: 'Trim a video to a chosen start and end time.',
    category: 'video',
    icon: 'scissors-line-dashed',
    color: 'text-indigo-600 bg-indigo-50',
    accept: 'video/mp4,video/quicktime,video/webm',
    multiple: false,
    status: 'coming-soon',
  },
];

export function getTool(slug: string): ToolDef | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function toolsByCategory(category: ToolCategory): ToolDef[] {
  return TOOLS.filter((t) => t.category === category);
}

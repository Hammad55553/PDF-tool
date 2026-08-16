import { ToolError } from './api-utils';

/**
 * Office document conversion (PDF <-> Word / Excel / PowerPoint).
 *
 * Vercel's serverless functions cannot run LibreOffice (the `soffice` binary
 * is far too large and slow for a serverless function), so instead we call a
 * hosted conversion API — ConvertAPI (https://www.convertapi.com). This works
 * on any host, including Vercel, with no system binaries.
 *
 * Setup:
 *   1. Create a free account at https://www.convertapi.com/a/signin
 *   2. Copy your API token (Dashboard -> Authentication -> "Your secret").
 *   3. Add it as an environment variable in Vercel:
 *        CONVERTAPI_TOKEN = <your token>
 *      (Settings -> Environment Variables, then Redeploy.)
 *
 * The free tier gives a limited number of conversions to test with; paid
 * plans lift the cap. The function signature is kept identical to the old
 * LibreOffice implementation so the API route needs no changes.
 */

// ConvertAPI expects a specific "from" -> "to" path in its URL. We map our
// (inputExt, outputFormat) pair to the correct ConvertAPI endpoint segments.
function convertApiPath(inputExt: string, outputFormat: string): string {
  const from = inputExt.toLowerCase();
  const to = outputFormat.toLowerCase();
  return `${from}/to/${to}`;
}

export async function convertWithLibreOffice(
  input: Buffer,
  inputExt: string,
  outputFormat: string,
): Promise<Buffer> {
  const token = process.env.CONVERTAPI_TOKEN;

  if (!token) {
    throw new ToolError(
      'Document conversion is not configured on this server yet. ' +
        'Add a CONVERTAPI_TOKEN environment variable (from convertapi.com) and redeploy to enable PDF ⇄ Office conversions.',
      503,
    );
  }

  const pathSegment = convertApiPath(inputExt, outputFormat);

  // Build a multipart/form-data body with the uploaded file. ConvertAPI reads
  // the file from the "File" field and returns the converted file directly
  // when we pass ?download=inline.
  const form = new FormData();
  const blob = new Blob([new Uint8Array(input)]);
  form.append('File', blob, `input.${inputExt}`);

  const url = `https://v2.convertapi.com/convert/${pathSegment}?Secret=${encodeURIComponent(
    token,
  )}&download=inline&StoreFile=false`;

  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', body: form });
  } catch {
    throw new ToolError('Could not reach the conversion service. Please try again in a moment.', 502);
  }

  if (!res.ok) {
    // ConvertAPI returns JSON error details on failure.
    let detail = '';
    try {
      const j = await res.json();
      detail = j?.Message || j?.message || '';
    } catch {
      /* ignore body parse errors */
    }
    if (res.status === 401 || res.status === 403) {
      throw new ToolError(
        'The conversion service rejected the request (invalid or expired CONVERTAPI_TOKEN). Please check the token in your environment variables.',
        503,
      );
    }
    throw new ToolError(
      detail
        ? `Document conversion failed: ${detail}`
        : 'Document conversion failed. Please check the file and try again.',
      502,
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  const out = Buffer.from(arrayBuffer);
  if (out.length === 0) {
    throw new ToolError('The conversion service returned an empty file. Please try again.', 502);
  }
  return out;
}

/**
 * Kept for backwards compatibility with any code that checked for a local
 * LibreOffice install. Now reports whether the hosted conversion API is
 * configured (i.e. a token is present).
 */
export async function isLibreOfficeAvailable(): Promise<boolean> {
  return Boolean(process.env.CONVERTAPI_TOKEN);
}

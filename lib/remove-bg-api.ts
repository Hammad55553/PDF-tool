import { ToolError } from './api-utils';

/**
 * Calls the remove.bg API (https://www.remove.bg/api) to remove an image
 * background. This is the higher-quality, professional-grade path.
 *
 * Requires REMOVE_BG_API_KEY in the environment. Get a free key at
 * https://www.remove.bg/api (free tier: ~50 images/month, then paid).
 *
 * Returns a transparent PNG buffer, or throws:
 *  - a special QUOTA_EXCEEDED error when you're out of credits (so the caller
 *    can fall back to the local rembg engine),
 *  - a ToolError for other failures.
 */
export const QUOTA_EXCEEDED = 'REMOVEBG_QUOTA_EXCEEDED';

export function isRemoveBgConfigured(): boolean {
  return Boolean(process.env.REMOVE_BG_API_KEY);
}

export async function removeBackgroundViaApi(input: Buffer): Promise<Buffer> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) throw new ToolError('remove.bg API key is not set.', 503);

  const form = new FormData();
  form.append('image_file', new Blob([new Uint8Array(input)]), 'image.png');
  form.append('size', 'auto');

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: form,
  });

  if (res.ok) {
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // Out of credits / rate limited → signal the caller to fall back to rembg.
  if (res.status === 402 || res.status === 429) {
    throw new Error(QUOTA_EXCEEDED);
  }

  // Other errors: surface a friendly message.
  let detail = '';
  try {
    const body = await res.json();
    detail = body?.errors?.[0]?.title || '';
  } catch {
    /* ignore */
  }
  throw new ToolError(`remove.bg failed${detail ? `: ${detail}` : ''}.`, res.status);
}

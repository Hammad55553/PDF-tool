import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { ToolError } from './api-utils';
import { isRemoveBgConfigured, removeBackgroundViaApi, QUOTA_EXCEEDED } from './remove-bg-api';

const execFileAsync = promisify(execFile);

/**
 * Combined background remover:
 *   1. If a remove.bg API key is set → use remove.bg (best quality).
 *   2. If remove.bg runs out of credits / isn't configured → fall back to the
 *      local Python `rembg` engine (free, always available).
 *
 * This gives the best result when credits are available and never breaks when
 * they aren't.
 */
export async function removeBackground(input: Buffer): Promise<Buffer> {
  // Try remove.bg first when configured.
  if (isRemoveBgConfigured()) {
    try {
      return await removeBackgroundViaApi(input);
    } catch (e: any) {
      // Out of credits / rate-limited → silently fall back to rembg.
      if (e?.message === QUOTA_EXCEEDED) {
        console.warn('[remove-background] remove.bg quota exceeded — falling back to rembg.');
      } else {
        // Any other remove.bg error → also fall back, but log it.
        console.warn('[remove-background] remove.bg failed, falling back to rembg:', e?.message);
      }
    }
  }

  // Fallback (or default): local rembg engine.
  return removeBackgroundViaRembg(input);
}

/**
 * Local Python `rembg` engine (free). Shells out to scripts/remove_bg.py.
 * See README "Background Remover setup" (`pip install rembg pillow onnxruntime
 * --break-system-packages`).
 */
export async function removeBackgroundViaRembg(input: Buffer): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const id = randomUUID();
  const inPath = path.join(tmpDir, `pdfkit-rembg-in-${id}.png`);
  const outPath = path.join(tmpDir, `pdfkit-rembg-out-${id}.png`);
  const scriptPath = path.join(process.cwd(), 'scripts', 'remove_bg.py');

  try {
    await fs.writeFile(inPath, input);

    const pythonBin = process.env.PYTHON_BIN || 'python3';
    // 5-minute timeout: the FIRST run downloads a ~170MB AI model, which can
    // take a while on slower connections. Subsequent runs are fast.
    await execFileAsync(pythonBin, [scriptPath, inPath, outPath], {
      timeout: 300_000,
      maxBuffer: 1024 * 1024 * 50,
    });

    return await fs.readFile(outPath);
  } catch (e: any) {
    const stderr: string = e?.stderr?.toString?.() ?? '';
    // Log the full Python error server-side so it's visible in the terminal.
    console.error('[remove-background] python failed:', { code: e?.code, killed: e?.killed, stderr });

    if (stderr.includes('Missing dependency')) {
      throw new ToolError(
        'Background removal is not set up on this server yet. Run: pip install rembg pillow onnxruntime --break-system-packages',
        503,
      );
    }
    if (e?.code === 'ENOENT') {
      throw new ToolError(
        'Python 3 was not found. Set PYTHON_BIN in .env.local to your python3 path (see README).',
        503,
      );
    }
    if (e?.killed || e?.signal === 'SIGTERM') {
      throw new ToolError(
        'Background removal timed out. The first run downloads a ~170MB model — please check your internet and try once more.',
        504,
      );
    }
    // Surface the real Python error message (last line) so it's actionable.
    const lastLine = stderr.trim().split('\n').filter(Boolean).pop() || 'Unknown error';
    throw new ToolError(`Background removal failed: ${lastLine}`, 500);
  } finally {
    await fs.unlink(inPath).catch(() => {});
    await fs.unlink(outPath).catch(() => {});
  }
}

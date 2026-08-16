import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { ToolError } from './api-utils';

const execFileAsync = promisify(execFile);

/**
 * Office document conversion (PDF<->Word/Excel/PowerPoint) via LibreOffice's
 * headless CLI (`soffice --headless --convert-to`).
 *
 * This is NOT wired into any UI route by default in this MVP — the
 * PDF-to-Word / Word-to-PDF / PDF-to-Excel / Excel-to-PDF / PPT-to-PDF tool
 * pages currently show a "Pro feature — coming soon" placeholder (see
 * lib/tools.ts `status: 'coming-soon'`), because LibreOffice was not
 * confirmed available in the build sandbox this project was generated in.
 *
 * However, the real conversion function below is fully implemented and
 * ready to use. To turn on real conversion for these tools:
 *   1. Install LibreOffice on your server:
 *        Ubuntu: sudo apt-get install -y libreoffice
 *        macOS:  brew install --cask libreoffice
 *   2. Confirm `soffice --version` works in your deployment environment.
 *   3. In lib/tools.ts, change the relevant tool's `status` from
 *      'coming-soon' to 'live'.
 *   4. In app/api/tools/[tool]/route.ts, uncomment/wire the matching case
 *      to call `convertWithLibreOffice()` from this file (see the comment
 *      block in that route for the exact case stub).
 *
 * Note: LibreOffice headless conversion is heavy (spins up a full office
 * suite process per call) and is NOT recommended on typical serverless
 * hosts (Vercel) due to cold start + binary size limits. For production,
 * run this on a dedicated VM/container (e.g. a small Docker service) rather
 * than inside the same process as your Next.js app.
 */
export async function convertWithLibreOffice(
  input: Buffer,
  inputExt: string,
  outputFormat: string,
): Promise<Buffer> {
  const tmpDir = path.join(os.tmpdir(), `pdfkit-office-${randomUUID()}`);
  await fs.mkdir(tmpDir, { recursive: true });

  const inPath = path.join(tmpDir, `input.${inputExt}`);
  await fs.writeFile(inPath, input);

  try {
    await execFileAsync(
      'soffice',
      ['--headless', '--convert-to', outputFormat, '--outdir', tmpDir, inPath],
      { timeout: 120_000 },
    );

    const files = await fs.readdir(tmpDir);
    const inputFilename = path.basename(inPath);
    const outputFile = files.find((f) => f.endsWith(`.${outputFormat}`) && f !== inputFilename);
    if (!outputFile) {
      throw new ToolError('LibreOffice did not produce an output file.');
    }
    return await fs.readFile(path.join(tmpDir, outputFile));
  } catch (e: any) {
    if (e?.code === 'ENOENT') {
      throw new ToolError(
        'LibreOffice is not installed on this server. This conversion is unavailable until it is set up (see README).',
        503,
      );
    }
    throw new ToolError('Document conversion failed. Please check the file and try again.');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function isLibreOfficeAvailable(): Promise<boolean> {
  try {
    await execFileAsync('soffice', ['--version']);
    return true;
  } catch {
    return false;
  }
}

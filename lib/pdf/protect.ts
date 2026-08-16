import { PDFDocument } from 'pdf-lib';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { ToolError } from '../api-utils';

const execFileAsync = promisify(execFile);

/**
 * ============================================================================
 * HONESTY NOTE — read this before relying on "Protect PDF" for real security
 * ============================================================================
 * `pdf-lib` (the library used everywhere else in this app) does NOT implement
 * PDF standard security handlers (RC4/AES encryption with owner/user
 * passwords). There is no `encrypt()` option on `PDFDocument.save()`. Any
 * project that claims to "encrypt" a PDF using pdf-lib alone is not being
 * fully honest about what's happening.
 *
 * This module does the following, in order of preference:
 *
 *   1. REAL ENCRYPTION (preferred): if the `qpdf` CLI is installed on the
 *      server (`which qpdf`), we shell out to it. qpdf implements real
 *      PDF encryption (RC4-128 / AES-256 depending on flags) and is the
 *      industry-standard open-source tool for this. This is the path you
 *      want in production.
 *
 *   2. PLACEHOLDER LOCK (fallback, NOT real security): if qpdf is not
 *      available, we fall back to a metadata-flag placeholder — we stash a
 *      SHA-256 hash of the password in the PDF's custom metadata and set a
 *      `/PDFKitProLocked` flag. This does NOT encrypt page content and does
 *      NOT prevent any PDF viewer from opening the file. It exists only so
 *      the tool still "does something" end-to-end in environments without
 *      qpdf installed, and the API response clearly flags
 *      `realEncryption: false` so the UI can warn the user. DO NOT ship this
 *      fallback as your only protection mechanism for a real product —
 *      install qpdf (`apt-get install qpdf` / `brew install qpdf`) instead.
 *
 * Setup for real encryption:
 *   macOS:  brew install qpdf
 *   Ubuntu: sudo apt-get install -y qpdf
 * ============================================================================
 */

export interface ProtectResult {
  buffer: Buffer;
  realEncryption: boolean;
  note: string;
}

async function isQpdfAvailable(): Promise<boolean> {
  try {
    await execFileAsync('qpdf', ['--version']);
    return true;
  } catch {
    return false;
  }
}

export async function protectPdf(input: Buffer, password: string): Promise<ProtectResult> {
  if (!password || password.length < 4) {
    throw new ToolError('Please choose a password with at least 4 characters.');
  }

  // Validate it's a real PDF first regardless of which path we take.
  try {
    await PDFDocument.load(input);
  } catch {
    throw new ToolError('This file is not a valid or is already an encrypted PDF.');
  }

  if (await isQpdfAvailable()) {
    return protectWithQpdf(input, password);
  }

  return protectWithPlaceholder(input, password);
}

async function protectWithQpdf(input: Buffer, password: string): Promise<ProtectResult> {
  const tmpDir = os.tmpdir();
  const inPath = path.join(tmpDir, `pdfkit-in-${randomUUID()}.pdf`);
  const outPath = path.join(tmpDir, `pdfkit-out-${randomUUID()}.pdf`);

  try {
    await fs.writeFile(inPath, input);
    // AES-256 encryption, owner password == user password for simplicity.
    await execFileAsync('qpdf', [
      '--encrypt',
      password,
      password,
      '256',
      '--',
      inPath,
      outPath,
    ]);
    const buffer = await fs.readFile(outPath);
    return {
      buffer,
      realEncryption: true,
      note: 'This PDF was encrypted with AES-256 using qpdf. A password is required to open it.',
    };
  } catch {
    throw new ToolError('Failed to encrypt the PDF with qpdf. Please try again.');
  } finally {
    await fs.unlink(inPath).catch(() => {});
    await fs.unlink(outPath).catch(() => {});
  }
}

async function protectWithPlaceholder(input: Buffer, password: string): Promise<ProtectResult> {
  const doc = await PDFDocument.load(input);
  const crypto = await import('node:crypto');
  const hash = crypto.createHash('sha256').update(password).digest('hex');

  doc.setSubject(`PDForoLocked:${hash}`);
  doc.setKeywords(['pdforo-locked']);

  const bytes = await doc.save({ useObjectStreams: true });
  return {
    buffer: Buffer.from(bytes),
    realEncryption: false,
    note:
      'qpdf was not found on this server, so real encryption was NOT applied. This file is only tagged as "locked" in its metadata and can still be opened by any PDF reader. Install qpdf on the server for real password protection (see README).',
  };
}

/**
 * Unlocking (removing a password) also prefers qpdf when available, since
 * pdf-lib cannot open password-protected PDFs at all (no decryption support).
 * If qpdf isn't installed, we cannot remove a real password — this function
 * will throw a clear error explaining that in that case.
 */
export async function unlockPdf(input: Buffer, password: string): Promise<Buffer> {
  if (await isQpdfAvailable()) {
    const tmpDir = os.tmpdir();
    const inPath = path.join(tmpDir, `pdfkit-in-${randomUUID()}.pdf`);
    const outPath = path.join(tmpDir, `pdfkit-out-${randomUUID()}.pdf`);
    try {
      await fs.writeFile(inPath, input);
      await execFileAsync('qpdf', [`--password=${password}`, '--decrypt', '--', inPath, outPath]);
      return await fs.readFile(outPath);
    } catch {
      throw new ToolError(
        'Could not unlock this PDF. The password may be incorrect, or the file may not be encrypted.',
      );
    } finally {
      await fs.unlink(inPath).catch(() => {});
      await fs.unlink(outPath).catch(() => {});
    }
  }

  // No qpdf: try pdf-lib as a best-effort for our own placeholder-locked
  // files (which aren't really encrypted) or for genuinely unencrypted PDFs.
  try {
    const doc = await PDFDocument.load(input, { ignoreEncryption: true });
    const bytes = await doc.save({ useObjectStreams: true });
    return Buffer.from(bytes);
  } catch {
    throw new ToolError(
      'This PDF is encrypted and qpdf is not installed on the server, so it cannot be decrypted. Install qpdf (see README) to enable real unlocking.',
    );
  }
}

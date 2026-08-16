/**
 * lib/api-utils.ts
 * Small shared helpers for the tool API routes.
 */
import { NextResponse } from 'next/server';

export class ToolError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ToolError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message =
    err instanceof Error ? err.message : 'Something went wrong while processing your file.';
  // Keep messages user-friendly; log full detail server-side.
  console.error('[tool-error]', err);
  return NextResponse.json(
    { error: friendlyMessage(message) },
    { status: 500 },
  );
}

function friendlyMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('encrypt') || lower.includes('password')) {
    return 'This PDF appears to be password-protected or encrypted. Please unlock it first.';
  }
  if (lower.includes('invalid pdf') || lower.includes('failed to parse')) {
    return 'This file does not look like a valid PDF. Please check the file and try again.';
  }
  if (lower.includes('unsupported image') || lower.includes('input file contains unsupported image format')) {
    return 'This image format is not supported. Please upload a JPG, PNG, or WEBP file.';
  }
  return 'We could not process this file. Please make sure it is a valid, non-corrupted file and try again.';
}

/** Extracts all File entries from a form field, whether single or multiple. */
export function getFiles(form: FormData, field: string): File[] {
  return form.getAll(field).filter((v): v is File => v instanceof File);
}

export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export const MAX_ABSOLUTE_FILE_SIZE = 200 * 1024 * 1024; // hard server ceiling regardless of plan

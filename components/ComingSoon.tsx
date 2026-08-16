import Link from 'next/link';
import type { ToolDef } from '@/lib/tools';

export default function ComingSoon({ tool }: { tool: ToolDef }) {
  return (
    <div className="dropzone">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-500">
        <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-slate-900">{tool.name} is coming soon</h2>
      <p className="max-w-md text-sm text-slate-500">
        This conversion needs a document-conversion engine (LibreOffice) that isn&apos;t enabled on
        this server yet. The integration code already exists in{' '}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">lib/office-convert.ts</code> —
        see the README for how to turn it on.
      </p>
      <Link href="/pricing" className="btn-secondary mt-2">
        Notify me when it&apos;s ready
      </Link>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import ToolIcon from './ToolIcon';
import { CATEGORIES, toolsByCategory } from '@/lib/tools';

/**
 * Hamburger menu shown only below the `md` breakpoint. Replaces the header's
 * inline nav on small screens, in a full slide-down panel that lists every
 * tool grouped by category.
 */
export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-[65px] z-30 max-h-[calc(100vh-65px)] overflow-y-auto border-b border-slate-100 bg-white px-4 py-4 shadow-lg">
          <nav className="flex flex-col gap-1">
            <Link
              href="/resume"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Resume
              <span className="rounded-full bg-fuchsia-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-fuchsia-700">New</span>
            </Link>
            <Link
              href="/pricing"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Pricing
            </Link>

            {CATEGORIES.map((cat) => (
              <div key={cat.key} className="mt-2">
                <p className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  {cat.label}
                </p>
                {toolsByCategory(cat.key).map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded-md ${tool.color}`}>
                      <ToolIcon name={tool.icon} className="h-4 w-4" />
                    </span>
                    {tool.name}
                  </Link>
                ))}
              </div>
            ))}

            <Link
              href="/pricing"
              onClick={() => setOpen(false)}
              className="mt-3 rounded-lg bg-gradient-to-r from-brand-600 to-accent-500 px-3 py-2.5 text-center text-sm font-semibold text-white"
            >
              Go Pro
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}

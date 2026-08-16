'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import ToolIcon from './ToolIcon';
import { CATEGORIES, toolsByCategory } from '@/lib/tools';

/**
 * "All Tools" mega-dropdown in the header — hover/click to reveal every tool
 * grouped by category, iLovePDF-style. Desktop only (md+); mobile uses
 * MobileNav instead.
 */
export default function ToolsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-brand-700"
      >
        All tools
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 w-[640px] -translate-x-1/2 pt-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
            {CATEGORIES.map((cat) => (
              <div key={cat.key}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  {cat.label}
                </p>
                <ul className="space-y-1">
                  {toolsByCategory(cat.key).map((tool) => (
                    <li key={tool.slug}>
                      <Link
                        href={`/tools/${tool.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        <span className={`flex h-7 w-7 items-center justify-center rounded-md ${tool.color}`}>
                          <ToolIcon name={tool.icon} className="h-4 w-4" />
                        </span>
                        {tool.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

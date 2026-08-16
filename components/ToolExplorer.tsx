'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import ToolCard from './ToolCard';
import { TOOLS, CATEGORIES, type ToolCategory } from '@/lib/tools';

type Filter = 'all' | ToolCategory;

const VALID_CATEGORIES = new Set(CATEGORIES.map((c) => c.key));

/**
 * The homepage tool browser: a search box + category tabs (iLovePDF-style)
 * that live-filter the tool grid. Client component so filtering is instant
 * with no page reload. Reads an optional category from the URL hash
 * (e.g. /#convert) so header links can deep-link into a category.
 */
export default function ToolExplorer() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    function applyHash() {
      const hash = window.location.hash.replace('#', '');
      if (VALID_CATEGORIES.has(hash as ToolCategory)) {
        setFilter(hash as ToolCategory);
      } else if (hash === 'tools' || hash === '') {
        setFilter('all');
      }
    }
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const visibleTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((t) => {
      const matchesCategory = filter === 'all' || t.category === filter;
      const matchesQuery =
        q === '' ||
        t.name.toLowerCase().includes(q) ||
        t.shortDescription.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, filter]);

  return (
    <div>
      {/* Search */}
      <div className="mx-auto mb-6 max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools… (e.g. merge, compress, word)"
            className="w-full rounded-full border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        <TabButton active={filter === 'all'} onClick={() => setFilter('all')}>
          All tools
        </TabButton>
        {CATEGORIES.map((c) => (
          <TabButton key={c.key} active={filter === c.key} onClick={() => setFilter(c.key)}>
            {c.label}
          </TabButton>
        ))}
      </div>

      {/* Grid */}
      {visibleTools.length === 0 ? (
        <p className="py-16 text-center text-slate-400">No tools match “{query}”.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-brand-600 text-white shadow-sm'
          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );
}

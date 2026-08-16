import Link from 'next/link';
import ToolIcon from './ToolIcon';
import type { ToolDef } from '@/lib/tools';

export default function ToolCard({ tool }: { tool: ToolDef }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tool.color} transition-transform group-hover:scale-105`}>
          <ToolIcon name={tool.icon} className="h-6 w-6" />
        </div>
        {tool.badge && (
          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            {tool.badge}
          </span>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">{tool.name}</h3>
        <p className="mt-1 text-sm text-slate-500">{tool.shortDescription}</p>
      </div>
    </Link>
  );
}

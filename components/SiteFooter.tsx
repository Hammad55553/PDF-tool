import Link from 'next/link';
import Logo from './Logo';
import { TOOLS } from '@/lib/tools';

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Fast, private PDF and image tools that run entirely on our own servers —
              no third-party uploads.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Popular Tools</h4>
            <ul className="mt-3 space-y-2">
              {TOOLS.slice(0, 6).map((t) => (
                <li key={t.slug}>
                  <Link href={`/tools/${t.slug}`} className="text-sm text-slate-500 hover:text-brand-700">
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Company</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/pricing" className="text-sm text-slate-500 hover:text-brand-700">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/#tools" className="text-sm text-slate-500 hover:text-brand-700">
                  All Tools
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-100 pt-6 text-xs text-slate-400">
          &copy; {year} PDForo. All processing happens server-side; files are not stored
          longer than needed to process your request.
        </div>
      </div>
    </footer>
  );
}

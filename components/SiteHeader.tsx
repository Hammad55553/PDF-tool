import Link from 'next/link';
import Logo from './Logo';
import AuthButton from './AuthButton';
import MobileNav from './MobileNav';
import ToolsMenu from './ToolsMenu';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
          <ToolsMenu />
          <Link href="/#convert" className="text-sm font-medium text-slate-600 hover:text-brand-700">
            Convert
          </Link>
          <Link href="/#edit" className="text-sm font-medium text-slate-600 hover:text-brand-700">
            Edit
          </Link>
          <Link href="/#security" className="text-sm font-medium text-slate-600 hover:text-brand-700">
            Security
          </Link>
          <Link
            href="/resume"
            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-brand-700"
          >
            Resume
            <span className="rounded-full bg-fuchsia-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-fuchsia-700">New</span>
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-brand-700">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/pricing"
            className="hidden rounded-full bg-gradient-to-r from-brand-600 to-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:opacity-90 lg:inline-flex"
          >
            Go Pro
          </Link>
          <AuthButton />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

import Link from 'next/link';
import { LayoutTemplate, Code2, Gauge, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Resume Builder — Templates, LaTeX Editor & ATS Checker',
  description:
    'Build a professional resume with PDForo: ready-made templates, an Overleaf-style LaTeX editor, and a free ATS score checker to beat applicant tracking systems.',
  alternates: { canonical: '/resume' },
};

const features = [
  {
    slug: 'templates',
    icon: LayoutTemplate,
    title: 'Resume Templates',
    desc: 'Pick from professionally designed, recruiter-approved templates and fill them in — no design skills needed.',
    color: 'text-rose-600 bg-rose-50',
  },
  {
    slug: 'latex',
    icon: Code2,
    title: 'LaTeX Editor',
    desc: 'An Overleaf-style online LaTeX editor with live PDF preview — perfect for clean, typeset academic & technical CVs.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    slug: 'ats',
    icon: Gauge,
    title: 'ATS Score Checker',
    desc: 'Upload your resume + a job description and get an ATS compatibility score with keyword suggestions to get past filters.',
    color: 'text-emerald-600 bg-emerald-50',
  },
];

export default function ResumePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      {/* Hero */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-4 py-1.5 text-xs font-semibold text-fuchsia-700">
          New — Resume Suite
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
          Build a resume that gets you{' '}
          <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
            interviews
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
          Templates, a professional LaTeX editor, and a free ATS checker — all in one place.
        </p>
      </div>

      {/* Feature cards */}
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.slug} className="card flex flex-col">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}>
              <f.icon className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">{f.title}</h2>
            <p className="mt-2 flex-1 text-sm text-slate-500">{f.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 self-start">
              Coming soon
            </span>
          </div>
        ))}
      </div>

      {/* Notify banner */}
      <div className="mt-12 flex flex-col items-center justify-between gap-5 rounded-2xl bg-gradient-to-r from-brand-600 to-accent-500 px-6 py-8 text-center text-white sm:flex-row sm:text-left">
        <div>
          <h3 className="text-xl font-bold sm:text-2xl">Want early access?</h3>
          <p className="mt-1 text-sm text-white/85 sm:text-base">
            The Resume Suite is in the works. Create a free account and we&apos;ll let you know when it&apos;s live.
          </p>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-card transition hover:bg-brand-50"
        >
          Get started <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

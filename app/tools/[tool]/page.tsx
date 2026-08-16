import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTool, TOOLS } from '@/lib/tools';
import ToolIcon from '@/components/ToolIcon';
import ToolWorkspace from '@/components/ToolWorkspace';
import ComingSoon from '@/components/ComingSoon';
import AdSlot from '@/components/AdSlot';
import { SITE, absoluteUrl } from '@/lib/seo';

export function generateStaticParams() {
  return TOOLS.map((t) => ({ tool: t.slug }));
}

export function generateMetadata({ params }: { params: { tool: string } }): Metadata {
  const tool = getTool(params.tool);
  if (!tool) return {};
  const title = `${tool.name} — Free Online`;
  const description = `${tool.description} Free, fast and private with ${SITE.name}. No signup required.`;
  const url = absoluteUrl(`/tools/${tool.slug}`);
  return {
    title,
    description,
    keywords: [tool.name.toLowerCase(), `${tool.name} online`, `${tool.name} free`, 'PDF tools', SITE.name],
    alternates: { canonical: `/tools/${tool.slug}` },
    openGraph: {
      title: `${tool.name} — ${SITE.name}`,
      description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tool.name} — ${SITE.name}`,
      description,
    },
  };
}

/** How-to steps + FAQ tailored per tool, used for on-page SEO content + JSON-LD. */
function toolFaq(name: string): { q: string; a: string }[] {
  return [
    {
      q: `Is ${name} free to use?`,
      a: `Yes. ${name} is free on ${SITE.name} for files up to the free-plan limits. Upgrade to Pro or Ultra Pro for larger files, no ads and priority processing.`,
    },
    {
      q: `Is it safe to use ${name} online?`,
      a: `Your files are processed on our own servers and are not stored longer than needed to complete your request. No account is required for the free tier.`,
    },
    {
      q: `Do I need to install anything?`,
      a: `No. ${name} runs entirely in your browser — nothing to download or install. It works on desktop, tablet and mobile.`,
    },
  ];
}

export default function ToolPage({ params }: { params: { tool: string } }) {
  const tool = getTool(params.tool);
  if (!tool) return notFound();

  const faq = toolFaq(tool.name);

  // JSON-LD: HowTo (steps) + FAQ + breadcrumbs → rich Google results.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HowTo',
        name: `How to ${tool.name}`,
        description: tool.description,
        step: [
          { '@type': 'HowToStep', position: 1, name: 'Upload', text: `Select or drag & drop your file into the ${tool.name} tool.` },
          { '@type': 'HowToStep', position: 2, name: 'Process', text: `Click the button to run ${tool.name}.` },
          { '@type': 'HowToStep', position: 3, name: 'Download', text: 'Download your processed file instantly.' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
          { '@type': 'ListItem', position: 2, name: tool.name, item: absoluteUrl(`/tools/${tool.slug}`) },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-16 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mb-6 flex flex-col items-center text-center sm:mb-10">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-100 to-brand-50 text-brand-600 shadow-xl shadow-brand-500/10 ring-1 ring-white/60 backdrop-blur-sm sm:mb-6 sm:h-20 sm:w-20 sm:rounded-3xl">
          <ToolIcon name={tool.icon} className="h-7 w-7 sm:h-10 sm:w-10" />
        </div>
        <h1 className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-4xl lg:text-5xl">
          {tool.name}
        </h1>
        <p className="mt-3 max-w-xl px-2 text-sm text-slate-500 sm:mt-4 sm:text-lg">{tool.description}</p>
      </div>

      <div className="card mx-auto max-w-3xl">
        {tool.status === 'coming-soon' ? <ComingSoon tool={tool} /> : <ToolWorkspace tool={tool} />}
      </div>

      {/* Ad shown only to Free users (hidden for Pro / Ultra Pro) */}
      <AdSlot variant="banner" className="mt-8" />

      {/* SEO content: how-to + FAQ (visible + machine-readable via JSON-LD above) */}
      <section className="mx-auto mt-12 max-w-3xl">
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">How to {tool.name.toLowerCase()} online</h2>
        <ol className="mt-4 space-y-3">
          {[
            `Upload your file — drag & drop it, or click to choose a file.`,
            `Adjust any options if the tool offers them, then run ${tool.name}.`,
            `Download your result in seconds. Your files are never stored long-term.`,
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">
                {i + 1}
              </span>
              <span className="text-slate-600">{step}</span>
            </li>
          ))}
        </ol>

        <h2 className="mt-10 text-xl font-bold text-slate-900 sm:text-2xl">Frequently asked questions</h2>
        <div className="mt-4 space-y-4">
          {faq.map((f) => (
            <div key={f.q} className="rounded-xl border border-slate-100 bg-white p-4">
              <h3 className="font-semibold text-slate-900">{f.q}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

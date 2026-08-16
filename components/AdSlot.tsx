'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import AdsterraBanner from './AdsterraBanner';

/**
 * Ad unit shown ONLY to Free users (Pro / Ultra Pro are ad-free).
 *
 * Network priority (whichever is configured wins, in this order):
 *   1. Google AdSense  — best long-term earnings + SEO-safe (needs approval).
 *   2. Adsterra banner — instant approval, use to earn while AdSense is pending.
 *   3. Placeholder     — tidy filler nudging toward the ad-free Pro upgrade.
 *
 * Only clean banner formats are used — no popunder / social-bar / push, which
 * would hurt UX and SEO.
 *
 * Deliberately conservative placement (below results / after the grid), one
 * unit per view, so it earns without annoying users.
 */
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT; // e.g. "ca-pub-1234567890123456"

// Adsterra banner: paste the ad-unit key + the size you picked when creating it.
const ADSTERRA_KEY = process.env.NEXT_PUBLIC_ADSTERRA_KEY;
const ADSTERRA_W = Number(process.env.NEXT_PUBLIC_ADSTERRA_WIDTH || 728);
const ADSTERRA_H = Number(process.env.NEXT_PUBLIC_ADSTERRA_HEIGHT || 90);

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSlot({
  slot,
  variant = 'banner',
  className = '',
}: {
  /** AdSense ad-unit slot ID (numeric). Optional; falls back to env default. */
  slot?: string;
  variant?: 'banner' | 'box';
  className?: string;
}) {
  const [showAds, setShowAds] = useState<boolean | null>(null);
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const supabase = createSupabaseBrowserClient();

  const slotId = slot || process.env.NEXT_PUBLIC_ADSENSE_SLOT || '';
  const adsenseReady = Boolean(ADSENSE_CLIENT && slotId);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        if (!cancelled) setShowAds(true); // signed out → Free → ads
        return;
      }
      const { data: row } = await supabase
        .from('pdfkit_users')
        .select('plan')
        .eq('id', data.user.id)
        .maybeSingle();
      const paid = row?.plan === 'pro' || row?.plan === 'ultra';
      if (!cancelled) setShowAds(!paid);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once we know we're showing a real ad, tell AdSense to fill this slot.
  useEffect(() => {
    if (showAds === true && adsenseReady && !pushed.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      } catch {
        // AdSense script not loaded yet / blocked — safe to ignore.
      }
    }
  }, [showAds, adsenseReady]);

  if (showAds !== true) return null;

  // 1) AdSense (preferred)
  if (adsenseReady) {
    return (
      <div className={`mx-auto w-full max-w-3xl ${className}`}>
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: 'block', minHeight: variant === 'box' ? 250 : 90 }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // 2) Adsterra banner (instant income until AdSense is approved)
  if (ADSTERRA_KEY) {
    return (
      <div className={`mx-auto w-full max-w-3xl overflow-hidden ${className}`}>
        <AdsterraBanner adKey={ADSTERRA_KEY} width={ADSTERRA_W} height={ADSTERRA_H} />
      </div>
    );
  }

  // 3) Placeholder (until any ad network is configured)
  const sizeClasses = variant === 'banner' ? 'h-24 sm:h-28' : 'h-64';
  return (
    <div className={`mx-auto w-full max-w-3xl ${className}`}>
      <div
        className={`relative flex ${sizeClasses} w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center`}
      >
        <div className="px-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Advertisement</p>
          <p className="mt-1 text-sm text-slate-400">
            Your ad could be here.{' '}
            <Link href="/pricing" className="font-semibold text-brand-600 hover:text-brand-700">
              Go ad-free with Pro →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

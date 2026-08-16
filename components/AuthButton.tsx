'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import ProAvatar from './ProAvatar';
import AuthModal from './AuthModal';

/**
 * Header auth control. Logged out → "Sign in" button that opens AuthModal
 * (Google + email/password). Logged in → avatar linking to /account, with a
 * special animated ring + PRO label for Pro members.
 */
export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [planLabel, setPlanLabel] = useState<string | null>(null); // null = free/none
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const supabase = createSupabaseBrowserClient();
  const isPro = planLabel !== null;

  useEffect(() => {
    let cancelled = false;

    async function loadPlan(u: User | null) {
      if (!u) {
        setPlanLabel(null);
        return;
      }
      const { data } = await supabase.from('pdfkit_users').select('plan').eq('id', u.id).maybeSingle();
      if (cancelled) return;
      if (data?.plan === 'ultra') setPlanLabel('Ultra Pro');
      else if (data?.plan === 'pro') setPlanLabel('Pro');
      else setPlanLabel(null);
    }

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data.user);
      setLoading(false);
      loadPlan(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      loadPlan(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />;
  }

  if (user) {
    const label = user.user_metadata?.full_name || user.email || 'Account';
    const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
    return (
      <Link
        href="/account"
        className="flex items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-1.5 transition hover:border-slate-200 hover:bg-slate-50"
        title={label}
      >
        <ProAvatar name={label} avatarUrl={avatarUrl} isPro={isPro} size={32} />
        <span className="hidden max-w-[130px] items-center gap-1.5 truncate text-sm font-medium text-slate-700 sm:flex">
          <span className="truncate">{label}</span>
          {planLabel && (
            <span className="whitespace-nowrap rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-white">
              {planLabel}
            </span>
          )}
        </span>
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:shadow-brand-500/30"
      >
        Sign in
      </button>
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}

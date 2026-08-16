'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function UpgradeButton({
  isLoggedIn,
  plan = 'pro',
  period = 'monthly',
  label,
}: {
  isLoggedIn: boolean;
  plan?: 'pro' | 'ultra';
  period?: 'monthly' | 'yearly';
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  async function handleUpgrade() {
    setLoading(true);
    setError(null);

    // Checkout requires a signed-in user (so the webhook knows who to upgrade).
    // If not signed in, kick off Google sign-in first — they'll return to
    // /pricing and can click again.
    if (!isLoggedIn) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/pricing` },
      });
      return;
    }

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, period }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not start checkout.');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const defaultLabel = label ?? (plan === 'ultra' ? 'Get Ultra Pro' : 'Upgrade to Pro');

  return (
    <div>
      <button onClick={handleUpgrade} disabled={loading} className="btn-primary w-full">
        {loading ? 'Starting checkout…' : isLoggedIn ? defaultLabel : 'Sign in to upgrade'}
      </button>
      {error && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{error}</p>
      )}
    </div>
  );
}

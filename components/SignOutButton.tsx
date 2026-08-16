'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    try {
      // Revokes the session on Supabase AND clears the local token cookies.
      await supabase.auth.signOut();
    } catch {
      // Even if the network call fails, still fall through to a hard redirect
      // so the local session is dropped and the UI reflects a logged-out state.
    }
    // Full page navigation guarantees server components re-render as logged-out.
    window.location.href = '/';
  }

  return (
    <button
      onClick={signOut}
      disabled={loading}
      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  );
}

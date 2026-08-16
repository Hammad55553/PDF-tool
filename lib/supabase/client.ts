'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for use in Client Components ('use client' files).
 * Reads the public URL + anon key from env (safe to expose to the browser).
 *
 * During a production build, Next.js server-renders client components once to
 * generate the static HTML shell. If the Supabase env vars aren't present at
 * that moment, `createBrowserClient` throws and the whole build fails. To keep
 * the build resilient we only construct the real client when both env vars are
 * present; otherwise we hand back a no-op stub whose `auth.getUser()` resolves
 * to "no user" (exactly what a logged-out visitor sees). In the browser at
 * runtime — where NEXT_PUBLIC_ vars are always inlined — the real client is
 * always used, so end-user behaviour is unchanged.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (typeof window !== 'undefined') {
      // Real browser with missing config — surface a clear message.
      console.error(
        '[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. ' +
          'Add them in your Vercel project (Settings → Environment Variables) and redeploy.',
      );
    }
    // Build/prerender fallback: a harmless stub so rendering doesn't crash.
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe() {} } },
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof createBrowserClient>;
  }

  return createBrowserClient(url, anonKey);
}

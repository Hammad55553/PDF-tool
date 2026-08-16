import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase client for use in Server Components, Route Handlers, and Server
 * Actions. Reads/writes the user's session via cookies, so `auth.getUser()`
 * reflects whoever is actually logged in for this request.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component without write access to cookies
            // (e.g. during static rendering) — safe to ignore, middleware
            // handles session refresh in that case.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Same as above — safe to ignore outside a Route Handler/Action.
          }
        },
      },
    },
  );
}

/**
 * Admin client using the SERVICE ROLE key — bypasses Row Level Security.
 * ONLY use this in trusted server-only code (e.g. the Stripe webhook) that
 * needs to write to another user's row (a webhook has no "logged in user").
 * NEVER import this from a Client Component or expose the key with
 * NEXT_PUBLIC_.
 */
export function createSupabaseAdminClient() {
  const { createClient } = require('@supabase/supabase-js');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (Supabase Dashboard -> Project Settings -> API -> service_role secret).',
    );
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

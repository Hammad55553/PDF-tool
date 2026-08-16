import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes the Supabase auth session cookie on every request. Without this,
 * a signed-in user's session can silently expire and Server Components will
 * see them as logged out even though their browser still has a valid
 * refresh token. This is the standard Supabase + Next.js App Router pattern.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If the Supabase env vars aren't configured (e.g. not yet added in Vercel),
  // skip session refresh instead of throwing. Throwing here would make EVERY
  // request fail with MIDDLEWARE_INVOCATION_FAILED (500) and take the whole
  // site down. Without a session refresh the site still works fully; users
  // just won't have their auth cookie silently refreshed on that request.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[middleware] Supabase env vars missing — skipping session refresh. ' +
        'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel → Settings → Environment Variables.',
    );
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  try {
    await supabase.auth.getUser();
  } catch (err) {
    // Never let a transient auth/network error crash the edge middleware and
    // 500 the whole request — session refresh is best-effort.
    console.error('[middleware] session refresh failed (non-fatal):', err);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files and images, so the
     * session refresh runs on pages and API routes but not on assets.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PLAN_LIMITS, formatBytes, isPaidPlan, type Plan } from '@/lib/plan';
import SignOutButton from '@/components/SignOutButton';
import ProAvatar from '@/components/ProAvatar';
import ManageSubscriptionButton from '@/components/ManageSubscriptionButton';

export const metadata = {
  title: 'Your Account',
  robots: { index: false, follow: false }, // private page — don't index
};

// This page reads the logged-in user via Supabase (per-request cookies), so it
// must never be statically prerendered at build time. Forcing dynamic also
// prevents the build from crashing when Supabase env vars aren't present during
// the build step.
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { data: profile } = await supabase
    .from('pdfkit_users')
    .select('plan, stripe_current_period_end, created_at')
    .eq('id', user.id)
    .maybeSingle();

  const plan: Plan = profile?.plan === 'pro' || profile?.plan === 'ultra' ? profile.plan : 'free';
  const paid = isPaidPlan(plan);
  const limits = PLAN_LIMITS[plan];
  const name = user.user_metadata?.full_name || user.email || 'Your account';
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const renewsOn = profile?.stripe_current_period_end
    ? new Date(profile.stripe_current_period_end).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-slate-900">Your account</h1>
      <p className="mt-2 text-slate-500">Manage your profile, plan, and sign-in.</p>

      {/* Profile card */}
      <div className="card mt-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
        <ProAvatar name={name} avatarUrl={avatarUrl} isPro={paid} size={64} />
        <div className="min-w-0">
          <p className="flex items-center justify-center gap-2 sm:justify-start">
            <span className="truncate text-lg font-bold text-slate-900">{name}</span>
            {paid && (
              <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                {limits.label}
              </span>
            )}
          </p>
          <p className="truncate text-sm text-slate-500">{user.email}</p>
          {memberSince && <p className="mt-1 text-xs text-slate-400">Member since {memberSince}</p>}
        </div>
      </div>

      {/* Plan card */}
      <div className="card mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current plan</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-slate-900">
              {limits.label}
              {paid && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  Active
                </span>
              )}
            </p>
          </div>
          {plan === 'free' ? (
            <Link href="/pricing" className="btn-primary w-full sm:w-auto">
              Upgrade to Pro
            </Link>
          ) : plan === 'pro' ? (
            <Link href="/pricing" className="btn-primary w-full sm:w-auto">
              Upgrade to Ultra Pro
            </Link>
          ) : (
            <Link href="/pricing" className="btn-secondary w-full sm:w-auto">
              Manage plan
            </Link>
          )}
        </div>

        {paid && (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {renewsOn ? (
                <>
                  Auto-renews on <span className="font-medium text-slate-700">{renewsOn}</span>. You
                  can turn this off anytime.
                </>
              ) : (
                'Your subscription auto-renews. You can turn this off anytime.'
              )}
            </p>
            <ManageSubscriptionButton />
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-3 border-t border-slate-100 pt-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Max file size</p>
            <p className="mt-1 font-semibold text-slate-800">{formatBytes(limits.maxFileSizeBytes)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Files per batch</p>
            <p className="mt-1 font-semibold text-slate-800">{limits.maxFilesPerOperation}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pages per operation</p>
            <p className="mt-1 font-semibold text-slate-800">{limits.maxPagesPerOperation}</p>
          </div>
        </div>
      </div>

      {/* Sign out card */}
      <div className="card mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">Signed in with Google</p>
          <p className="truncate text-sm text-slate-500">{user.email}</p>
        </div>
        <SignOutButton />
      </div>
    </div>
  );
}

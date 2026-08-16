import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Creates a Stripe Checkout session for a paid plan ('pro' or 'ultra').
 *
 * The request body may include { plan: 'pro' | 'ultra', period: 'monthly' |
 * 'yearly' } — defaults to pro/monthly. Each (plan x period) maps to a Stripe
 * Price ID from env, e.g. STRIPE_PRICE_ID_PRO_YEARLY. The signed-in user's
 * Supabase ID goes in `client_reference_id` and the chosen plan/period in
 * `metadata`, so the webhook knows WHO paid and WHICH tier to grant.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripeClient();

  if (!stripe) {
    return NextResponse.json(
      {
        error:
          'Stripe is not configured yet. Add STRIPE_SECRET_KEY to your .env.local file — see .env.example and the README.',
      },
      { status: 501 },
    );
  }

  // Which plan + billing period is being purchased?
  let plan: 'pro' | 'ultra' = 'pro';
  let period: 'monthly' | 'yearly' = 'monthly';
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.plan === 'ultra') plan = 'ultra';
    if (body?.period === 'yearly') period = 'yearly';
  } catch {
    // no body → defaults
  }

  // Pick the Stripe price ID for this (plan x period) combination.
  const priceEnvKey = `STRIPE_PRICE_ID_${plan.toUpperCase()}_${period.toUpperCase()}`;
  const priceId = process.env[priceEnvKey];

  if (!priceId) {
    return NextResponse.json(
      {
        error: `${priceEnvKey} is not set. Add the ${plan === 'ultra' ? 'Ultra Pro' : 'Pro'} ${period} Price ID to .env.local.`,
      },
      { status: 501 },
    );
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Please sign in first, then upgrade.' },
      { status: 401 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/pricing?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      metadata: { plan, period, supabase_user_id: user.id },
      subscription_data: { metadata: { plan, period, supabase_user_id: user.id } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[stripe-checkout-error]', err);
    return NextResponse.json(
      { error: 'Could not start checkout. Please try again in a moment.' },
      { status: 500 },
    );
  }
}

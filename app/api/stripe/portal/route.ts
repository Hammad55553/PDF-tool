import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Creates a Stripe Customer Portal session and returns its URL. The portal is
 * Stripe's own secure, hosted page where the user can:
 *   - cancel their subscription (turns OFF auto-renew — stays active until the
 *     end of the paid period, then drops to Free),
 *   - update their card / payment method,
 *   - view invoices and billing history,
 *   - switch between monthly/yearly or plans (if enabled in the portal config).
 *
 * We look up the user's stripe_customer_id (saved by the webhook on first
 * purchase) so the portal opens on the right account.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 501 });
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('pdfkit_users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No active subscription found for this account yet.' },
      { status: 400 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/account`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[stripe-portal-error]', err);
    return NextResponse.json(
      { error: 'Could not open the billing portal. Please try again.' },
      { status: 500 },
    );
  }
}

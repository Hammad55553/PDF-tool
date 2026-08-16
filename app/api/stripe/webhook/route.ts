import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

/**
 * Stripe webhook endpoint.
 *
 * Configure the endpoint URL in your Stripe Dashboard -> Developers ->
 * Webhooks, pointing to https://yourdomain.com/api/stripe/webhook, subscribed
 * to at minimum:
 *   - checkout.session.completed
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *
 * This uses the Supabase SERVICE ROLE client (bypasses Row Level Security)
 * because a webhook has no logged-in user/session of its own — it needs to
 * write to whichever user's row matches the Stripe customer/session.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook is not configured (missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET).' },
      { status: 501 },
    );
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed', err);
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      // Which tier they bought — set in checkout metadata ('pro' | 'ultra').
      const boughtPlan = session.metadata?.plan === 'ultra' ? 'ultra' : 'pro';

      if (!userId) {
        console.error(
          '[stripe-webhook] checkout.session.completed had no client_reference_id — cannot identify which user to upgrade.',
        );
        break;
      }

      const { error } = await supabaseAdmin
        .from('pdfkit_users')
        .update({
          plan: boughtPlan,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('[stripe-webhook] failed to upgrade user:', error);
      } else {
        console.log('[stripe-webhook] user', userId, 'upgraded to', boughtPlan);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const isActive = sub.status === 'active' || sub.status === 'trialing';
      // Preserve the tier the user is on (stored in the subscription metadata
      // by checkout). If active → that tier; otherwise → free.
      const tier = sub.metadata?.plan === 'ultra' ? 'ultra' : 'pro';

      const { error } = await supabaseAdmin
        .from('pdfkit_users')
        .update({
          plan: isActive ? tier : 'free',
          stripe_current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', sub.id);

      if (error) {
        console.error('[stripe-webhook] failed to sync subscription update:', error);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;

      const { error } = await supabaseAdmin
        .from('pdfkit_users')
        .update({ plan: 'free', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', sub.id);

      if (error) {
        console.error('[stripe-webhook] failed to downgrade cancelled subscription:', error);
      }
      break;
    }

    default:
      console.log('[stripe-webhook] unhandled event type:', event.type);
  }

  return NextResponse.json({ received: true });
}

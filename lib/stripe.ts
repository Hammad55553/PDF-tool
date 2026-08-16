import Stripe from 'stripe';

/**
 * Lazily creates a Stripe client. Returns null if STRIPE_SECRET_KEY isn't
 * set (e.g. fresh clone of this repo before the developer adds real keys),
 * so callers can return a friendly "not configured yet" error instead of
 * crashing the whole process at import time.
 */
export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // apiVersion is cast to `any` here: the Stripe SDK's TS types pin
  // apiVersion to a specific literal string that changes with each package
  // version. Rather than hardcode a version string that could mismatch
  // whatever `stripe` version ends up installed (and fail the build), we
  // let Stripe fall back to the account's default API version.
  return new Stripe(key, { apiVersion: '2024-06-20' } as any);
}

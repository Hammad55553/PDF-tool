/**
 * lib/plan.ts
 *
 * Plan configuration + gating helpers for the three tiers:
 *   - free    : small limits, shows ads, watermark on output
 *   - pro     : big limits, no ads, no watermark, priority
 *   - ultra   : "Ultra Pro" — highest limits, no ads, top priority
 *
 * Pricing is positioned slightly below the main competitors (iLovePDF ~$9/mo,
 * Smallpdf ~$15/mo) so it stays attractive worldwide.
 *
 * The real plan for a signed-in user is read server-side from the
 * `pdfkit_users.plan` column in Supabase (see app/api/tools/[tool]/route.ts
 * and the Stripe webhook). The limits below are what gate each operation.
 */

export type Plan = 'free' | 'pro' | 'ultra';

export interface PlanLimits {
  /** Maximum size of a single uploaded file, in bytes. */
  maxFileSizeBytes: number;
  /** Maximum number of files that can be combined in one operation (e.g. Merge). */
  maxFilesPerOperation: number;
  /** Maximum total pages allowed across an operation (Split/Compress/etc). */
  maxPagesPerOperation: number;
  /** Whether a visible watermark is stamped onto output files. */
  watermarkOutput: boolean;
  /** Whether ads are shown to this plan (free = yes, paid = ad-free). */
  showAds: boolean;
  /** Human label used in the UI. */
  label: string;
  /** Monthly price in USD (0 for free). */
  priceUsd: number;
  /** Total annual price in USD, billed once per year (0 for free). */
  priceUsdYearly: number;
}

export type BillingPeriod = 'monthly' | 'yearly';

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB
    maxFilesPerOperation: 2,
    maxPagesPerOperation: 30,
    watermarkOutput: true,
    showAds: true,
    label: 'Free',
    priceUsd: 0,
    priceUsdYearly: 0,
  },
  pro: {
    maxFileSizeBytes: 200 * 1024 * 1024, // 200 MB
    maxFilesPerOperation: 50,
    maxPagesPerOperation: 2000,
    watermarkOutput: false,
    showAds: false,
    label: 'Pro',
    priceUsd: 8.49, // slightly below iLovePDF's ~$9/mo
    priceUsdYearly: 71.0, // ~30% off vs 12x monthly (~$5.92/mo)
  },
  ultra: {
    maxFileSizeBytes: 1024 * 1024 * 1024, // 1 GB
    maxFilesPerOperation: 200,
    maxPagesPerOperation: 10000,
    watermarkOutput: false,
    showAds: false,
    label: 'Ultra Pro',
    priceUsd: 14.99, // slightly below Smallpdf's ~$15/mo
    priceUsdYearly: 125.0, // ~30% off vs 12x monthly (~$10.42/mo)
  },
};

/** True for any paid tier (used to hide ads / watermark). */
export function isPaidPlan(plan: Plan): boolean {
  return plan === 'pro' || plan === 'ultra';
}

/** Price for a given plan + billing period. */
export function planPrice(plan: Plan, period: BillingPeriod): number {
  const l = PLAN_LIMITS[plan];
  return period === 'yearly' ? l.priceUsdYearly : l.priceUsd;
}

/** Discount % when paying yearly vs 12x the monthly price (rounded). */
export function yearlySavingsPercent(plan: Plan): number {
  const l = PLAN_LIMITS[plan];
  if (l.priceUsd === 0) return 0;
  const monthlyTotal = l.priceUsd * 12;
  return Math.round((1 - l.priceUsdYearly / monthlyTotal) * 100);
}

export interface PlanCheckInput {
  plan: Plan;
  fileSizesBytes: number[];
  pageCount?: number;
}

export interface PlanCheckResult {
  allowed: boolean;
  /** User-friendly message to show, prompting an upgrade if not allowed. */
  message?: string;
}

/**
 * Checks a proposed operation (file sizes, file count, optional page count)
 * against the limits for the given plan. Returns a friendly error message
 * that nudges the user toward /pricing when a limit is exceeded.
 */
export function checkPlanLimits(input: PlanCheckInput): PlanCheckResult {
  const limits = PLAN_LIMITS[input.plan];
  const { fileSizesBytes, pageCount } = input;
  const upsell = input.plan === 'free' ? 'Upgrade to Pro' : 'Upgrade to Ultra Pro';

  if (fileSizesBytes.length > limits.maxFilesPerOperation) {
    return {
      allowed: false,
      message: `${limits.label} plan allows up to ${limits.maxFilesPerOperation} files per operation. You uploaded ${fileSizesBytes.length}. ${upsell} for more.`,
    };
  }

  const oversized = fileSizesBytes.find((size) => size > limits.maxFileSizeBytes);
  if (oversized !== undefined) {
    const maxMb = Math.round(limits.maxFileSizeBytes / (1024 * 1024));
    const gotMb = (oversized / (1024 * 1024)).toFixed(1);
    return {
      allowed: false,
      message: `${limits.label} plan allows files up to ${maxMb}MB. One of your files is ${gotMb}MB. ${upsell} for larger files.`,
    };
  }

  if (pageCount !== undefined && pageCount > limits.maxPagesPerOperation) {
    return {
      allowed: false,
      message: `${limits.label} plan allows up to ${limits.maxPagesPerOperation} pages per operation. This file has ${pageCount}. ${upsell} for higher limits.`,
    };
  }

  return { allowed: true };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

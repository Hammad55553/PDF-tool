'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import UpgradeButton from './UpgradeButton';
import {
  PLAN_LIMITS,
  formatBytes,
  planPrice,
  yearlySavingsPercent,
  type Plan,
  type BillingPeriod,
} from '@/lib/plan';

interface Row {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  ultra: string | boolean;
}

const rows: Row[] = [
  {
    label: 'Max file size',
    free: formatBytes(PLAN_LIMITS.free.maxFileSizeBytes),
    pro: formatBytes(PLAN_LIMITS.pro.maxFileSizeBytes),
    ultra: formatBytes(PLAN_LIMITS.ultra.maxFileSizeBytes),
  },
  {
    label: 'Files per batch',
    free: `${PLAN_LIMITS.free.maxFilesPerOperation}`,
    pro: `${PLAN_LIMITS.pro.maxFilesPerOperation}`,
    ultra: `${PLAN_LIMITS.ultra.maxFilesPerOperation}`,
  },
  {
    label: 'Pages per operation',
    free: `${PLAN_LIMITS.free.maxPagesPerOperation}`,
    pro: `${PLAN_LIMITS.pro.maxPagesPerOperation}`,
    ultra: `${PLAN_LIMITS.ultra.maxPagesPerOperation}`,
  },
  { label: 'Ad-free experience', free: false, pro: true, ultra: true },
  { label: 'No output watermark', free: false, pro: true, ultra: true },
  { label: 'Priority processing', free: false, pro: true, ultra: true },
  { label: 'All conversion tools', free: true, pro: true, ultra: true },
  { label: 'Highest limits + top priority', free: false, pro: false, ultra: true },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="mx-auto h-5 w-5 text-emerald-500" />;
  if (value === false) return <X className="mx-auto h-5 w-5 text-slate-300" />;
  return <span className="font-medium text-slate-800">{value}</span>;
}

export default function PricingPlans({
  currentPlan,
  isLoggedIn,
}: {
  currentPlan: Plan;
  isLoggedIn: boolean;
}) {
  const [period, setPeriod] = useState<BillingPeriod>('monthly');

  return (
    <div>
      {/* Billing period toggle */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <span className={`text-sm font-semibold ${period === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>
          Monthly
        </span>
        <button
          onClick={() => setPeriod(period === 'monthly' ? 'yearly' : 'monthly')}
          className={`relative h-7 w-14 rounded-full transition-colors ${
            period === 'yearly' ? 'bg-brand-600' : 'bg-slate-200'
          }`}
          aria-label="Toggle billing period"
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
              period === 'yearly' ? 'left-8' : 'left-1'
            }`}
          />
        </button>
        <span className={`text-sm font-semibold ${period === 'yearly' ? 'text-slate-900' : 'text-slate-400'}`}>
          Yearly
        </span>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
          Save {yearlySavingsPercent('pro')}%
        </span>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        <PlanCard name="Free" planKey="free" tagline="Great for occasional use." period={period} currentPlan={currentPlan} isLoggedIn={isLoggedIn} />
        <PlanCard name="Pro" planKey="pro" tagline="For freelancers & power users." period={period} highlighted currentPlan={currentPlan} isLoggedIn={isLoggedIn} />
        <PlanCard name="Ultra Pro" planKey="ultra" tagline="Maximum limits & top priority." period={period} ultra currentPlan={currentPlan} isLoggedIn={isLoggedIn} />
      </div>

      {/* Comparison table */}
      <div className="mt-14 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3 text-left font-semibold text-slate-500">Features</th>
              <th className="py-3 text-center font-semibold text-slate-700">Free</th>
              <th className="py-3 text-center font-semibold text-brand-700">Pro</th>
              <th className="py-3 text-center font-semibold text-amber-600">Ultra Pro</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-slate-100">
                <td className="py-3 text-slate-600">{r.label}</td>
                <td className="py-3 text-center"><Cell value={r.free} /></td>
                <td className="py-3 text-center"><Cell value={r.pro} /></td>
                <td className="py-3 text-center"><Cell value={r.ultra} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        All paid plans auto-renew — you can turn that off (cancel) anytime from your account. Prices
        in USD. Stripe checkout requires the site owner to add the four Price IDs (see README).
      </p>
    </div>
  );
}

function PlanCard({
  name,
  planKey,
  tagline,
  period,
  highlighted = false,
  ultra = false,
  currentPlan,
  isLoggedIn,
}: {
  name: string;
  planKey: Plan;
  tagline: string;
  period: BillingPeriod;
  highlighted?: boolean;
  ultra?: boolean;
  currentPlan: Plan;
  isLoggedIn: boolean;
}) {
  const isCurrent = currentPlan === planKey;
  const border = ultra
    ? 'border-2 border-amber-400'
    : highlighted
    ? 'border-2 border-brand-500'
    : 'border border-slate-100';

  const isFree = planKey === 'free';
  const yearlyTotal = planPrice(planKey, 'yearly');
  const monthlyEquivalent = period === 'yearly' && !isFree ? (yearlyTotal / 12).toFixed(2) : null;
  const displayPrice = isFree ? '$0' : `$${planPrice(planKey, period).toFixed(2)}`;
  const priceSuffix = isFree ? '' : period === 'yearly' ? '/yr' : '/mo';

  return (
    <div className={`card relative flex flex-col ${border}`}>
      {ultra && (
        <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-white">
          {isCurrent ? 'Your plan' : 'Best value'}
        </span>
      )}
      {highlighted && !ultra && (
        <span className="absolute -top-3 left-6 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
          {isCurrent ? 'Your plan' : 'Most popular'}
        </span>
      )}

      <h2 className="text-xl font-bold text-slate-900">{name}</h2>
      <p className="mt-1 text-sm text-slate-500">{tagline}</p>
      <p className="mt-6 text-4xl font-extrabold text-slate-900">
        {displayPrice}
        <span className="text-base font-medium text-slate-400">{priceSuffix}</span>
      </p>
      {monthlyEquivalent && (
        <p className="mt-1 text-xs text-emerald-600">
          ≈ ${monthlyEquivalent}/mo — billed yearly, save {yearlySavingsPercent(planKey)}%
        </p>
      )}

      <div className="mt-8 flex-1" />

      {isFree ? (
        <button className="btn-secondary" disabled>
          {isCurrent ? 'Current plan' : 'Free forever'}
        </button>
      ) : isCurrent ? (
        <div className="btn-primary pointer-events-none opacity-80">You're on {name} ✓</div>
      ) : (
        <UpgradeButton
          isLoggedIn={isLoggedIn}
          plan={planKey as 'pro' | 'ultra'}
          period={period}
          label={`Get ${name}`}
        />
      )}
    </div>
  );
}

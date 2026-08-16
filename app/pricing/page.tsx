import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Plan } from '@/lib/plan';
import PricingPlans from '@/components/PricingPlans';

export const metadata = {
  title: 'Pricing — Free, Pro & Ultra Pro Plans',
  description:
    'PDForo pricing: start free, or go Pro / Ultra Pro for bigger files, no ads and priority processing. Monthly or yearly (save 30%). Priced below iLovePDF and Smallpdf.',
  alternates: { canonical: '/pricing' },
};

export default async function PricingPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlan: Plan = 'free';
  if (user) {
    const { data } = await supabase.from('pdfkit_users').select('plan').eq('id', user.id).maybeSingle();
    if (data?.plan === 'pro' || data?.plan === 'ultra') currentPlan = data.plan;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Simple, honest pricing</h1>
        <p className="mt-3 text-slate-500">
          Start free. Upgrade for bigger files, no ads, and priority — priced below the competition.
          Pay monthly or save with yearly.
        </p>
      </div>

      <PricingPlans currentPlan={currentPlan} isLoggedIn={!!user} />
    </div>
  );
}

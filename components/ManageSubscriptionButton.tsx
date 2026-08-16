'use client';

import { useState } from 'react';
import { Loader2, Settings } from 'lucide-react';

/**
 * Opens the Stripe Customer Portal so the user can cancel (turn off
 * auto-renew), change their card, or view invoices. Shown on the account page
 * for paid users.
 */
export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not open the billing portal.');
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={openPortal}
        disabled={loading}
        className="btn-secondary w-full sm:w-auto"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
        Manage subscription
      </button>
      {error && <p className="mt-2 text-xs text-amber-600">{error}</p>}
    </div>
  );
}

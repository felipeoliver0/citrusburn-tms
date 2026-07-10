'use client';

import { useState } from 'react';
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface BillingSectionProps {
  role: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  billingConfigured: boolean;
}

export default function BillingSection({
  role,
  subscriptionStatus,
  trialEndsAt,
  billingConfigured,
}: BillingSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (role !== 'CARRIER') return null;

  const trialActive =
    subscriptionStatus === 'TRIAL' && trialEndsAt && new Date(trialEndsAt) > new Date();
  const isActive = subscriptionStatus === 'ACTIVE' || trialActive;

  async function handleSubscribe() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout');
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel border border-gray-100 rounded-2xl shadow-xl overflow-hidden p-6 bg-white">
      <h3 className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-6 border-b border-gray-100 pb-2 flex items-center gap-2">
        <CreditCard size={16} /> Billing & Subscription
      </h3>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {isActive ? (
            <CheckCircle2 className="text-green-500 shrink-0" size={22} />
          ) : (
            <AlertCircle className="text-amber-500 shrink-0" size={22} />
          )}
          <div>
            <div className="text-sm font-bold text-gray-900">
              Status: {subscriptionStatus === 'TRIAL' && trialActive ? 'Free Trial' : subscriptionStatus}
            </div>
            {trialActive && trialEndsAt && (
              <div className="text-xs text-gray-500 mt-1">
                Trial ends {new Date(trialEndsAt).toLocaleDateString()}
              </div>
            )}
            {subscriptionStatus === 'ACTIVE' && (
              <div className="text-xs text-gray-500 mt-1">$20/driver/month — full loadboard access</div>
            )}
          </div>
        </div>

        {!isActive && billingConfigured && (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-brand-500 hover:bg-brand-400 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
            Subscribe Now
          </button>
        )}

        {!billingConfigured && (
          <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
            Stripe billing is not configured in this environment. Carriers have full access during development.
          </p>
        )}

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
      </div>
    </div>
  );
}

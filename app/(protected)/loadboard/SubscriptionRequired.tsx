import Link from 'next/link';
import { CreditCard, Zap } from 'lucide-react';

export default function SubscriptionRequired({ trialExpired }: { trialExpired?: boolean }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Loadboard</h1>
      </header>

      <div className="max-w-lg mx-auto text-center bg-white border border-gray-200 rounded-3xl p-10 shadow-xl">
        <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CreditCard className="text-brand-600" size={32} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">
          {trialExpired ? 'Your trial has ended' : 'Subscription required'}
        </h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Subscribe to access the loadboard, dispatch drivers, and manage your fleet.
          Plans start at $20/driver/month.
        </p>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg"
        >
          <Zap size={18} /> Manage Subscription
        </Link>
      </div>
    </div>
  );
}

import { verifySession } from '@/lib/dal';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import BillingSection from './BillingSection';
import { isBillingEnforced } from '@/lib/subscription';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const { userId } = await verifySession();
  const resolved = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      subscriptionStatus: true,
      trialEndsAt: true,
    },
  });

  if (!user) redirect('/login');

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 pb-10">
      <div className="max-w-3xl space-y-8">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">
            System <span className="text-brand-400">Settings</span>
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Customize your platform experience and notifications.</p>
        </header>

        {resolved.billing === 'success' && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-sm font-medium">
            Subscription activated successfully!
          </div>
        )}

        <BillingSection
          role={user.role}
          subscriptionStatus={user.subscriptionStatus}
          trialEndsAt={user.trialEndsAt?.toISOString() ?? null}
          billingConfigured={isBillingEnforced()}
        />

        <div className="space-y-8">
          <div className="glass-panel border border-gray-100 rounded-2xl shadow-xl overflow-hidden p-6 bg-white">
            <h3 className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-6 border-b border-gray-100 pb-2">
              Operational Preferences
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Timezone Display</label>
                <select className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-brand-500 appearance-none transition-colors">
                  <option value="EST">Eastern Time (EST) - Local</option>
                  <option value="CST">Central Time (CST)</option>
                  <option value="MST">Mountain Time (MST)</option>
                  <option value="PST">Pacific Time (PST)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Distance & Weight Units</label>
                <select className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-brand-500 appearance-none transition-colors">
                  <option value="imperial">Miles (mi) / Pounds (lbs)</option>
                  <option value="metric">Kilometers (km) / Kilograms (kg)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="glass-panel border border-gray-100 rounded-2xl shadow-xl overflow-hidden p-6 bg-white">
            <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-6 border-b border-gray-100 pb-2">
              Notification Center
            </h3>

            <div className="space-y-6">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-sm font-medium text-gray-900 group-hover:text-brand-400 transition-colors">Instant Load Match Alerts</div>
                  <div className="text-xs text-gray-500 mt-1">Email me when a new load matches my favorite routes</div>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                </div>
              </label>

              <hr className="border-gray-100" />

              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-sm font-medium text-gray-900 group-hover:text-brand-400 transition-colors">Broker Approval Updates</div>
                  <div className="text-xs text-gray-500 mt-1">Notify me immediately when my load request is approved or rejected</div>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                </div>
              </label>
            </div>
          </div>

          <div className="glass-panel border border-gray-100 rounded-2xl shadow-xl overflow-hidden p-6 bg-white">
            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-6 border-b border-gray-100 pb-2">
              Security & Access
            </h3>

            <div className="flex justify-between items-center bg-gray-50 p-5 rounded-xl border border-gray-100">
              <div>
                <div className="text-sm font-medium text-gray-900">Change Account Password</div>
                <div className="text-xs text-gray-500 mt-1">We will send a reset link to your corporate email</div>
              </div>
              <button className="bg-white/10 hover:bg-white/20 text-gray-900 text-xs font-bold px-5 py-2.5 rounded-lg transition-colors border border-gray-100">
                Request Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

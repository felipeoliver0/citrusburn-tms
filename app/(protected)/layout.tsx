import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { verifySession } from '@/lib/dal';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DriverTracker from './DriverTracker';
import NotificationBell from '@/app/components/NotificationBell';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await verifySession();
  const role = session.role || 'CARRIER';

  if (!session.onboardingCompleted) {
    redirect('/onboarding');
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
      <Sidebar userRole={role} />

      {/* Rastreio Fantasma do Motorista (100% do Tempo se ativo) */}
      {role === 'DRIVER' && <DriverTracker />}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 relative">
        <div className="relative z-10 flex flex-col h-full">
          {/* TOP BAR */}
          <header className="sticky top-0 z-50 flex justify-between items-center p-4 px-8 w-full backdrop-blur-md bg-white/40 border-b border-white/40 shadow-sm">
            <div className="flex-1">
              <Breadcrumbs />
            </div>
            <div className="flex justify-end">
              <NotificationBell />
            </div>
          </header>

          <div className="flex-1 p-8 pt-4 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

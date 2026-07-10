import { verifySession } from '@/lib/dal';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import BrokerDashboard from './components/BrokerDashboard';
import CarrierDashboard from './components/CarrierDashboard';
import DriverDashboard from './components/DriverDashboard';
import AdminDashboard from './components/AdminDashboard';

export default async function DashboardPage() {
  const { userId } = await verifySession();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      companyName: true,
      role: true
    }
  });

  if (!user) redirect('/login');

  if (user.role === 'DRIVER') {
    redirect('/driver');
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-800">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-blue-600">{user.fullName || user.companyName || 'User'}</span>
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Here is an overview of your operations today.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          <span className="text-sm font-bold tracking-wider text-gray-700 uppercase">{user.role === 'BROKER' ? 'SHIPPER' : user.role}</span>
        </div>
      </header>

      {user.role === 'BROKER' && <BrokerDashboard userId={user.id} />}
      {user.role === 'CARRIER' && <CarrierDashboard userId={user.id} />}
      {user.role === 'ADMIN' && <AdminDashboard />}
    </div>
  );
}

import prisma from '@/lib/prisma';
import { Users, Truck, Package, Activity } from 'lucide-react';
import Link from 'next/link';
import RevenueChart from './RevenueChart';

export default async function AdminDashboard() {
  // Aggregate Platform Data
  const totalShippers = await prisma.user.count({ where: { role: 'BROKER' } });
  const totalCarriers = await prisma.user.count({ where: { role: 'CARRIER' } });
  const totalDrivers = await prisma.user.count({ where: { role: 'DRIVER' } });
  const totalUsers = totalShippers + totalCarriers + totalDrivers;

  const activeLoads = await prisma.load.count({
    where: { status: { notIn: ['DELIVERED', 'INVOICED'] } }
  });

  const totalDelivered = await prisma.load.count({
    where: { status: 'DELIVERED' }
  });

  // Calculate platform revenue (Total money transacted on the platform)
  const revenueData = await prisma.load.aggregate({
    where: { status: { in: ['DELIVERED', 'INVOICED'] } },
    _sum: { price: true }
  });

  // Data for the last 7 days of transactions
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentLoads = await prisma.load.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true, price: true }
  });

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    
    const dayVolume = recentLoads
      .filter(load => {
        const loadDate = new Date(load.createdAt);
        return loadDate.getDate() === d.getDate() && loadDate.getMonth() === d.getMonth();
      })
      .reduce((sum, load) => sum + load.price, 0);

    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      volume: dayVolume
    };
  });

  return (
    <div className="space-y-8 animate-fade-in text-gray-900">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard icon={<Users />} label="Total Users" value={totalUsers.toString()} color="text-brand-600" bg="bg-brand-50" border="border-brand-200" />
        <SummaryCard icon={<Package />} label="Active Loads" value={activeLoads.toString()} color="text-amber-600" bg="bg-amber-50" border="border-amber-200" />
        <SummaryCard icon={<Truck />} label="Loads Delivered" value={totalDelivered.toString()} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-200" />
        <SummaryCard icon={<Activity />} label="Total Volume ($)" value={`$${revenueData._sum.price?.toLocaleString() || '0'}`} color="text-purple-600" bg="bg-purple-50" border="border-purple-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Volume Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Platform Volume (Last 7 Days)</h2>
          </div>
          <RevenueChart data={chartData} dataKey="volume" color="#10b981" />
        </div>

        {/* Quick Insights */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Platform Breakdown</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-bold text-gray-600">Shippers / Brokers</span>
              <span className="font-black text-brand-600">{totalShippers}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-bold text-gray-600">Carriers</span>
              <span className="font-black text-blue-600">{totalCarriers}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-bold text-gray-600">Drivers</span>
              <span className="font-black text-amber-600">{totalDrivers}</span>
            </div>

            <Link href="/admin/users" className="block mt-6 text-center w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors">
              Manage Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color, bg, border }: { icon: React.ReactNode, label: string, value: string, color: string, bg: string, border: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-5 hover:-translate-y-1 hover:shadow-md transition-all shadow-sm`}>
      <div className={`w-14 h-14 rounded-xl ${bg} ${color} border ${border} flex items-center justify-center shadow-sm`}>
        {icon}
      </div>
      <div>
        <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">{label}</div>
        <div className="text-3xl font-black text-gray-800 mt-1">{value}</div>
      </div>
    </div>
  );
}

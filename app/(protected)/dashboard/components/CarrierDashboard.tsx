import prisma from '@/lib/prisma';
import { Truck, MapPin, DollarSign, Clock, Package, Users } from 'lucide-react';
import Link from 'next/link';
import RevenueChart from './RevenueChart';
import StatusChart from './StatusChart';
import TopRoutesChart from './TopRoutesChart';

export default async function CarrierDashboard({ userId }: { userId: string }) {
  // Fetch aggregate data for the carrier
  const activeLoads = await prisma.load.count({
    where: {
      carrierId: userId,
      status: { in: ['IN_TRANSIT', 'BOOKED'] }
    }
  });

  const completedLoads = await prisma.load.count({
    where: {
      carrierId: userId,
      status: 'DELIVERED'
    }
  });

  const fleetSize = await prisma.user.count({
    where: {
      employerId: userId,
      role: 'DRIVER'
    }
  });

  const avgDriverLoads = fleetSize > 0 ? completedLoads / fleetSize : completedLoads;

  // Calculate estimated revenue
  const revenueData = await prisma.load.aggregate({
    where: {
      carrierId: userId,
      status: { in: ['DELIVERED', 'INVOICED'] }
    },
    _sum: {
      price: true
    }
  });

  const recentLoads = await prisma.load.findMany({
    where: { carrierId: userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { broker: { select: { companyName: true } } }
  });

  // Load Status grouping
  const statusGroup = await prisma.load.groupBy({
    by: ['status'],
    where: { carrierId: userId, status: { not: 'AVAILABLE' } },
    _count: { id: true }
  });
  const statusData = statusGroup.map(g => ({ name: g.status, value: g._count.id }));

  // Top Routes grouping
  const routesDataRaw = await prisma.load.findMany({
    where: { carrierId: userId, status: { in: ['DELIVERED', 'INVOICED'] } },
    select: { originCity: true, destCity: true, price: true }
  });

  const routesMap = new Map<string, number>();
  for (const load of routesDataRaw) {
    const routeName = `${load.originCity} \u2192 ${load.destCity}`;
    routesMap.set(routeName, (routesMap.get(routeName) || 0) + load.price);
  }
  const topRoutesData = Array.from(routesMap.entries())
    .map(([route, revenue]) => ({ route, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Real data for the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentCompletedLoads = await prisma.load.findMany({
    where: {
      carrierId: userId,
      status: { in: ['DELIVERED', 'INVOICED'] },
      createdAt: { gte: sevenDaysAgo }
    },
    select: {
      createdAt: true,
      price: true
    }
  });

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    
    const dayRevenue = recentCompletedLoads
      .filter(load => {
        const loadDate = new Date(load.createdAt);
        return loadDate.getDate() === d.getDate() && loadDate.getMonth() === d.getMonth();
      })
      .reduce((sum, load) => sum + load.price, 0);

    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: dayRevenue
    };
  });

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard icon={<Truck />} label="Active Loads" value={activeLoads.toString()} color="text-brand-600" bg="bg-brand-50" border="border-brand-200" />
        <SummaryCard icon={<MapPin />} label="Completed Deliveries" value={completedLoads.toString()} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-200" />
        <SummaryCard icon={<Users />} label="Avg Deliveries / Driver" value={avgDriverLoads.toFixed(1)} color="text-amber-600" bg="bg-amber-50" border="border-amber-200" />
        <SummaryCard icon={<DollarSign />} label="Total Revenue" value={`$${revenueData._sum.price?.toLocaleString() || '0'}`} color="text-purple-600" bg="bg-purple-50" border="border-purple-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Revenue Overview (Last 7 Days)</h2>
          </div>
          <RevenueChart data={chartData} dataKey="revenue" color="#2563eb" />
        </div>

        {/* Load Status Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Operations Status</h2>
          <StatusChart data={statusData} />
        </div>

        {/* Top Routes Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Most Profitable Routes</h2>
          <TopRoutesChart data={topRoutesData} color="#8b5cf6" />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/new-load" className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-100 hover:from-brand-100 hover:to-blue-100 transition-all">
              <Package className="text-brand-600" />
              <span className="font-bold text-brand-900">Post a New Load</span>
            </Link>
            <Link href="/loadboard" className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all">
              <MapPin className="text-gray-600" />
              <span className="font-bold text-gray-700">Find New Loads</span>
            </Link>
            <Link href="/fleet" className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all">
              <Truck className="text-gray-600" />
              <span className="font-bold text-gray-700">Manage Fleet</span>
            </Link>
            <Link href="/account" className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all">
              <DollarSign className="text-gray-600" />
              <span className="font-bold text-gray-700">Invoices & Billing</span>
            </Link>
          </div>
        </div>

        {/* Recent Loads Table */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Assigned Loads</h2>
            <Link href="/my-loads" className="text-sm font-bold text-brand-600 hover:text-brand-500 transition-colors">View All &rarr;</Link>
          </div>
          <div className="space-y-4">
            {recentLoads.length === 0 ? (
              <p className="text-gray-500">No loads assigned yet. Check the loadboard.</p>
            ) : (
              recentLoads.map(load => (
                <div key={load.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors">
                  <div>
                    <div className="font-bold text-gray-800">{load.originCity} &rarr; {load.destCity}</div>
                    <div className="text-sm text-gray-500 mt-1">Broker: {load.broker?.companyName || 'Unknown'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">${load.price}</div>
                    <div className="text-xs mt-1 uppercase font-bold tracking-wider text-gray-500">{load.status}</div>
                  </div>
                </div>
              ))
            )}
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

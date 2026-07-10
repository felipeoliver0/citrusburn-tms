import prisma from '@/lib/prisma';
import { Package, CheckCircle, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import Link from 'next/link';
import RevenueChart from './RevenueChart';
import StatusChart from './StatusChart';
import TopRoutesChart from './TopRoutesChart';

export default async function BrokerDashboard({ userId }: { userId: string }) {
  const activeLoads = await prisma.load.count({
    where: { brokerId: userId, status: { notIn: ['DELIVERED', 'INVOICED'] } }
  });

  const deliveredLoads = await prisma.load.count({
    where: { brokerId: userId, status: 'DELIVERED' }
  });

  const pendingRequests = await prisma.loadRequest.count({
    where: { load: { brokerId: userId }, status: 'PENDING' }
  });

  const recentLoads = await prisma.load.findMany({
    where: { brokerId: userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { carrier: { select: { companyName: true } } }
  });

  // Calculate Avg Price Per Mile
  const allDeliveredLoads = await prisma.load.findMany({
    where: { brokerId: userId, status: 'DELIVERED', distance: { gt: 0 } },
    select: { price: true, distance: true }
  });
  
  let avgPricePerMile = 0;
  if (allDeliveredLoads.length > 0) {
    const totalDistance = allDeliveredLoads.reduce((sum, load) => sum + load.distance, 0);
    const totalPrice = allDeliveredLoads.reduce((sum, load) => sum + load.price, 0);
    avgPricePerMile = totalDistance > 0 ? totalPrice / totalDistance : 0;
  }

  // Load Status grouping
  const statusGroup = await prisma.load.groupBy({
    by: ['status'],
    where: { brokerId: userId },
    _count: { id: true }
  });
  const statusData = statusGroup.map(g => ({ name: g.status, value: g._count.id }));

  // Top Routes grouping
  const routesDataRaw = await prisma.load.findMany({
    where: { brokerId: userId },
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

  // Real data for the last 7 days for Broker
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentPostedLoads = await prisma.load.findMany({
    where: {
      brokerId: userId,
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
    
    const dayVolume = recentPostedLoads
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard icon={<Package />} label="Active Posted Loads" value={activeLoads.toString()} color="text-brand-600" bg="bg-brand-50" border="border-brand-200" />
        <SummaryCard icon={<CheckCircle />} label="Delivered Loads" value={deliveredLoads.toString()} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-200" />
        <SummaryCard icon={<AlertCircle />} label="Pending Requests" value={pendingRequests.toString()} color="text-amber-600" bg="bg-amber-50" border="border-amber-200" />
        <SummaryCard icon={<DollarSign />} label="Avg Price / Mile" value={`$${avgPricePerMile.toFixed(2)}`} color="text-purple-600" bg="bg-purple-50" border="border-purple-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volume Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Posted Volume Overview (Last 7 Days)</h2>
          </div>
          <RevenueChart data={chartData} dataKey="volume" color="#0ea5e9" />
        </div>

        {/* Load Status Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Load Status Distribution</h2>
          <StatusChart data={statusData} />
        </div>

        {/* Top Routes Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Top Routes by Volume</h2>
          <TopRoutesChart data={topRoutesData} color="#0ea5e9" />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/new-load" className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-100 hover:from-brand-100 hover:to-blue-100 transition-all">
              <Package className="text-brand-600" />
              <span className="font-bold text-brand-900">Post a New Load</span>
            </Link>
            <Link href="/broker-requests" className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all">
              <AlertCircle className="text-gray-600" />
              <span className="font-bold text-gray-700 flex-1">Review Requests</span>
              {pendingRequests > 0 && <span className="bg-amber-500 text-white text-xs font-black px-2 py-1 rounded-md">{pendingRequests}</span>}
            </Link>
          </div>
        </div>

        {/* Recent Loads Table */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Your Recent Loads</h2>
            <Link href="/my-loads" className="text-sm font-bold text-brand-600 hover:text-brand-500 transition-colors">View All &rarr;</Link>
          </div>
          <div className="space-y-4">
            {recentLoads.length === 0 ? (
              <p className="text-gray-500">You haven't posted any loads yet.</p>
            ) : (
              recentLoads.map(load => (
                <div key={load.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors">
                  <div>
                    <div className="font-bold text-gray-800">{load.originCity} &rarr; {load.destCity}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Carrier: {load.carrier?.companyName || <span className="text-amber-600 font-bold">Pending Assignment</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-700">${load.price}</div>
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

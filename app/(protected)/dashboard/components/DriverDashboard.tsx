import prisma from '@/lib/prisma';
import { Truck, MapPin, CheckCircle, Navigation } from 'lucide-react';
import Link from 'next/link';

export default async function DriverDashboard({ userId }: { userId: string }) {
  const assignedLoads = await prisma.load.findMany({
    where: {
      driverId: userId,
      status: { in: ['BOOKED', 'IN_TRANSIT'] }
    },
    include: { broker: { select: { companyName: true, phone: true } } }
  });

  const completedCount = await prisma.load.count({
    where: { driverId: userId, status: 'DELIVERED' }
  });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard icon={<Truck />} label="Active Assigned Loads" value={assignedLoads.length.toString()} color="text-brand-600" bg="bg-brand-50" border="border-brand-200" />
        <SummaryCard icon={<CheckCircle />} label="Total Delivered" value={completedCount.toString()} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-200" />
        <SummaryCard icon={<Navigation />} label="Current Status" value="On Duty" color="text-blue-600" bg="bg-blue-50" border="border-blue-200" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Your Current Assignments</h2>
        
        {assignedLoads.length === 0 ? (
          <div className="p-8 text-center text-gray-500 border border-dashed border-gray-300 rounded-xl bg-gray-50">
            No active loads assigned to you right now. 
            <br/>Enjoy your downtime!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedLoads.map(load => (
              <div key={load.id} className="border border-gray-200 rounded-2xl p-5 hover:border-brand-300 transition-colors bg-gray-50 relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-xs uppercase text-gray-500 font-bold mb-1">Route</div>
                    <div className="font-black text-lg text-gray-800">{load.originCity}</div>
                    <div className="text-brand-500 font-bold">&darr;</div>
                    <div className="font-black text-lg text-gray-800">{load.destCity}</div>
                  </div>
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 bg-brand-100 text-brand-700 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                      {load.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    <span className="font-bold text-gray-800">Broker:</span> {load.broker.companyName}
                  </div>
                  <Link href={`/driver`} className="text-brand-600 hover:text-brand-700 font-bold text-sm flex items-center gap-1">
                    Manage <MapPin size={14}/>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color, bg, border }: { icon: React.ReactNode, label: string, value: string, color: string, bg: string, border: string }) {
  return (
    <div className={`bg-white rounded-2xl border ${border} p-6 flex items-center gap-5 hover:-translate-y-1 hover:shadow-md transition-all shadow-sm`}>
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

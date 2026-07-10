import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Target, Route, Calendar, ArrowRight, Camera, ClipboardCheck } from 'lucide-react';
import AutoRefresh from '@/app/components/AutoRefresh';
import GpsSimulator from '@/app/components/GpsSimulator';

export default async function DriverDashboard() {
  const { userId } = await verifySession();

  // Fetch active loads for this driver/carrier
  const activeLoads = await prisma.load.findMany({
    where: {
      OR: [
        { driverId: userId },
        { carrierId: userId }
      ],
      status: { in: ['BOOKED', 'IN_TRANSIT'] }
    },
    include: {
      broker: true
    },
    orderBy: { createdAt: 'asc' }
  });

  // Fetch recently completed loads
  const completedLoads = await prisma.load.findMany({
    where: {
      OR: [
        { driverId: userId },
        { carrierId: userId }
      ],
      status: 'DELIVERED'
    },
    include: {
      broker: true
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 pb-20">
      <AutoRefresh intervalMs={30000} />
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">
          My <span className="text-brand-500">Route</span>
        </h1>
        <p className="text-gray-500 mt-2 text-sm">Active dispatches requiring inspection or delivery.</p>
      </header>

      {activeLoads.length === 0 ? (
        <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-8 text-center flex flex-col items-center">
           <Route size={48} className="text-gray-300 mb-4" />
           <h3 className="text-lg font-bold text-gray-800">No active loads</h3>
           <p className="text-gray-500 text-sm mt-2">You don't have any pending pickups or deliveries at the moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeLoads.map(load => {
            const isPickup = load.status === 'BOOKED';
            const statusColor = isPickup ? 'text-brand-600' : 'text-green-600';
            const statusBg = isPickup ? 'bg-brand-50' : 'bg-green-50';

            return (
              <div key={load.id} className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                   <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full ${statusBg} ${statusColor}`}>
                        {load.status.replace('_', ' ')}
                      </span>
                   </div>
                   <span className="text-gray-400 text-xs font-bold uppercase">ID: {load.id.slice(-6)}</span>
                </div>

                {/* Route Info */}
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase">
                        <MapPin size={12} className="text-brand-500" /> Origin
                      </div>
                      <div className="text-gray-900 font-bold text-sm">{load.originCity} • {load.originZip}</div>
                    </div>
                  </div>

                  <div className="h-4 border-l-2 border-dashed border-gray-300 ml-1.5"></div>

                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase">
                        <Target size={12} className="text-green-500" /> Destination
                      </div>
                      <div className="text-gray-900 font-bold text-sm">{load.destCity} • {load.destZip}</div>
                    </div>
                  </div>
                </div>

                {/* Broker Info & Date */}
                <div className="p-5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-gray-500 gap-2 sm:gap-0 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" /> 
                    <span className="font-medium">{new Date(isPickup ? load.pickupDate || load.createdAt : load.deliveryDate || load.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Broker:</span> 
                    <span className="text-gray-800 font-bold">{load.broker?.companyName || 'N/A'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(isPickup ? `${load.originAddress ? load.originAddress + ', ' : ''}${load.originCity}, ${load.originZip}` : `${load.destAddress ? load.destAddress + ', ' : ''}${load.destCity}, ${load.destZip}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
                  >
                    <Route size={18} className="text-blue-500" /> Navigate to {isPickup ? 'Pickup' : 'Delivery'}
                  </a>

                  <Link 
                    href={`/driver/${load.id}/inspection`}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                      isPickup 
                        ? 'bg-brand-600 hover:bg-brand-500 text-white' 
                        : 'bg-green-600 hover:bg-green-500 text-white'
                    }`}
                  >
                    {isPickup ? (
                      <><ClipboardCheck size={18} /> Start Pickup Inspection</>
                    ) : (
                      <><Camera size={18} /> Start Delivery Inspection</>
                    )}
                  </Link>

                  {!isPickup && process.env.NODE_ENV === 'development' && (
                    <GpsSimulator 
                      origin={`${load.originCity}, ${load.originZip}`} 
                      dest={`${load.destCity}, ${load.destZip}`} 
                    />
                  )}
                </div>
                
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Loads Section */}
      {completedLoads.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <ClipboardCheck className="text-green-500" /> Recently Completed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedLoads.map(load => (
              <div key={load.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-400 font-bold mb-1">#{load.id.slice(-6).toUpperCase()}</div>
                  <div className="text-sm font-bold text-gray-800">{load.originCity} &rarr; {load.destCity}</div>
                  <div className="text-[10px] text-gray-500 mt-1">Delivered on {new Date(load.deliveryDate || load.createdAt).toLocaleDateString()}</div>
                </div>
                <Link href={`/load/${load.id}`} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs transition-colors border border-gray-200">
                  View Photos
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import { redirect } from 'next/navigation';
import FleetMapClient from './FleetMapClient';
import { Map, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function GlobalFleetMapPage() {
  const { userId } = await verifySession();

  const currentUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!currentUser || currentUser.role !== 'CARRIER') {
    return <div className="p-8 text-gray-800">Access Denied</div>;
  }

  // Fetch all IN_TRANSIT loads for this carrier that have coordinates
  const activeLoads = await prisma.load.findMany({
    where: {
      carrierId: userId,
      status: 'IN_TRANSIT',
      currentLat: { not: null },
      currentLng: { not: null }
    },
    include: { driver: true }
  });

  const mapData = activeLoads.map(load => ({
    id: load.id,
    currentLat: load.currentLat as number,
    currentLng: load.currentLng as number,
    driverName: load.driver?.fullName || 'Unknown Driver',
    originCity: load.originCity,
    destCity: load.destCity,
    status: load.status
  }));

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 p-6 md:p-8 max-w-7xl mx-auto">
      
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/fleet" className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-2 font-bold uppercase tracking-wider">
            <ArrowLeft size={16} /> Back to Fleet
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-gray-800">
            <Map className="text-brand-500" size={32} />
            Global Control Tower
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Real-time live map of your entire active fleet.</p>
        </div>
        
        <div className="bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-xl text-center">
          <div className="text-3xl font-black text-brand-600">{mapData.length}</div>
          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Active Trucks</div>
        </div>
      </header>

      <FleetMapClient loads={mapData} />

    </div>
  );
}

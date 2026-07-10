import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifySession } from '@/lib/dal';
import MapWrapper from './MapWrapper';

export default async function TrackingPage({ 
  params 
}: { 
  params: Promise<{ loadId: string }> 
}) {
  const { userId } = await verifySession();

  const resolvedParams = await params;
  const loadId = resolvedParams.loadId;

  const load = await prisma.load.findUnique({
    where: { id: loadId },
    include: { driver: true, carrier: true }
  });

  if (!load || !load.currentLat || !load.currentLng) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-6">
        <div className="text-6xl mb-4">🛰️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">No GPS Signal</h1>
        <p className="text-gray-500 mb-6 max-w-md">The driver has not turned on the GPS yet, or the signal was lost. Please check back later.</p>
        <Link href="/my-loads" className="bg-brand-600 text-gray-900 font-bold py-3 px-6 rounded-lg uppercase text-xs tracking-wider">
          Back to Dispatches
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <span className="text-brand-500">🛰️</span> Live Fleet Tracking
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Load ID: <span className="font-mono text-gray-900">#{load.id.substring(0,8).toUpperCase()}</span>
            </p>
          </div>
          <Link href="/my-loads" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors hidden md:block">
            &larr; Back to Dispatch Board
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Driver & Route Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-100 pb-2">Driver Active</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                  {load.driver?.fullName?.charAt(0) || 'D'}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{load.driver?.fullName || 'Assigned Driver'}</div>
                  <div className="text-xs text-blue-500 font-medium">📞 {load.driver?.phone || 'No phone'}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative pl-6 border-l-2 border-gray-200 pb-4">
                  <div className="absolute w-3 h-3 bg-gray-300 rounded-full -left-[7px] top-1 border-2 border-white"></div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Origin</div>
                  <div className="font-bold text-gray-900">{load.originCity} <span className="text-gray-500 font-normal">{load.originZip}</span></div>
                </div>
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-brand-500 rounded-full -left-[7px] top-1 border-2 border-white shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Destination</div>
                  <div className="font-bold text-gray-900">{load.destCity} <span className="text-gray-500 font-normal">{load.destZip}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Area */}
          <div className="lg:col-span-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm min-h-[500px]">
            <MapWrapper loadId={load.id} initialLat={load.currentLat} initialLng={load.currentLng} />
          </div>

        </div>

        {/* INSPECTION PHOTOS SECTION */}
        {(load.pickupPhotos || load.pickupVinPhoto || load.deliveryPhotos || load.deliveryVinPhoto) && (
          <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">Vehicle Inspection Photos</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Pickup Photos */}
              <div>
                <h3 className="text-sm font-bold text-brand-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-500"></span> Pickup Inspection
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {load.pickupVinPhoto && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden group relative">
                      <img src={load.pickupVinPhoto} alt="Pickup VIN" className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider p-1 text-center backdrop-blur-sm">VIN Photo</div>
                    </div>
                  )}
                  {Array.isArray(load.pickupPhotos) && load.pickupPhotos.map((photo: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden group relative">
                      <img src={photo.base64} alt={photo.part} className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider p-1 text-center backdrop-blur-sm">{photo.part}</div>
                    </div>
                  ))}
                  {!load.pickupVinPhoto && (!Array.isArray(load.pickupPhotos) || load.pickupPhotos.length === 0) && (
                    <div className="col-span-2 p-6 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm font-bold">
                      No pickup photos available
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Photos */}
              <div>
                <h3 className="text-sm font-bold text-green-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> Delivery Inspection
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {load.deliveryVinPhoto && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden group relative">
                      <img src={load.deliveryVinPhoto} alt="Delivery VIN" className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider p-1 text-center backdrop-blur-sm">VIN Photo</div>
                    </div>
                  )}
                  {Array.isArray(load.deliveryPhotos) && load.deliveryPhotos.map((photo: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden group relative">
                      <img src={photo.base64} alt={photo.part} className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider p-1 text-center backdrop-blur-sm">{photo.part}</div>
                    </div>
                  ))}
                  {!load.deliveryVinPhoto && (!Array.isArray(load.deliveryPhotos) || load.deliveryPhotos.length === 0) && (
                    <div className="col-span-2 p-6 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm font-bold">
                      No delivery photos available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

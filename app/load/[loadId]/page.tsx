import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import LiveTrackerMapClient from './LiveTrackerMapClient';
import GeneratePDFButton from './GeneratePDFButton';
import { getSession } from '@/lib/dal';
import ChatBox from '@/app/components/ChatBox';

export const dynamic = 'force-dynamic';

export default async function LoadMap({ 
  params 
}: { 
  params: Promise<{ loadId: string }> 
}) {
  const resolvedParams = await params;
  const loadId = resolvedParams.loadId;

  // Busca os dados da carga no banco
  const load = await prisma.load.findUnique({
    where: { id: loadId },
    include: { carrier: true, broker: true, locationHistory: { orderBy: { timestamp: 'asc' } } }
  });

  if (!load) redirect('/loadboard');

  // Verify Authorization
  const { userId, role } = await getSession();
  const isAuthorized = userId && (load.brokerId === userId || load.carrierId === userId || load.driverId === userId || role === 'ADMIN');

  // Formata os endereços para a URL do Google Maps (Cidade, Zip Code)
  // We ONLY show the exact address to authorized users
  const originQuery = isAuthorized && load.originAddress ? `${load.originAddress}, ${load.originCity}, ${load.originZip}` : `${load.originCity}, ${load.originZip}`;
  const destQuery = isAuthorized && load.destAddress ? `${load.destAddress}, ${load.destCity}, ${load.destZip}` : `${load.destCity}, ${load.destZip}`;

  const originAddressMapUrl = encodeURIComponent(originQuery);
  const destAddressMapUrl = encodeURIComponent(destQuery);

  // Gera a URL do iframe do Google Maps focada exclusivamente em Trajeto (Directions)
  const mapUrl = `https://maps.google.com/maps?saddr=${originAddressMapUrl}&daddr=${destAddressMapUrl}&output=embed&dirflg=d`;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 font-sans">
      
      {/* CABEÇALHO */}
      <header className="mb-8 border-b border-gray-200 pb-6 flex justify-between items-center max-w-5xl mx-auto">
        <div>
          <a href="/loadboard" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">&larr; Back to Loadboard</a>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mt-2">
            Route <span className="text-brand-500">Map Overview</span>
          </h1>
          <p className="text-gray-500 mt-1 text-xs font-mono">Load ID: {load.id}</p>
        </div>
        {isAuthorized && (
          <GeneratePDFButton load={load} />
        )}
      </header>

      {/* GRID PRINCIPAL */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Painel Lateral com Resumo */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 h-fit shadow-xl space-y-5">
          <div className="flex justify-between items-center border-b border-gray-200 pb-3">
            <span className="bg-brand-500/10 text-brand-500 border border-brand-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              {load.status}
            </span>
            <span className="text-xl font-bold text-brand-600">${load.price}</span>
          </div>

          <div className="space-y-3 text-sm">
            <div>
            <div className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Origin (A)</div>
              <div className="font-bold text-gray-900">{load.originCity} ({load.originZip})</div>
              {isAuthorized && load.originAddress && (
                <div className="text-xs text-gray-500 mt-0.5">{load.originAddress}</div>
              )}
            </div>
            <div>
              <div className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Destination (B)</div>
              <div className="font-bold text-gray-900">{load.destCity} ({load.destZip})</div>
              {isAuthorized && load.destAddress && (
                <div className="text-xs text-gray-500 mt-0.5">{load.destAddress}</div>
              )}
            </div>
            
            <div className="pt-3 border-t border-gray-200">
              <div className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Total Distance</div>
              <div className="font-bold text-brand-500">{load.distance} miles</div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Assigned Carrier</div>
              <div className="font-medium text-gray-600 mt-0.5">
                {load.carrier ? (
                  <a href={`/profile/${load.carrier.id}`} className="text-brand-600 hover:underline">{load.carrier.companyName || 'Carrier'}</a>
                ) : 'Awaiting acceptance'}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Shipper</div>
              <div className="font-medium text-gray-600 mt-0.5">
                <a href={`/profile/${load.broker.id}`} className="text-brand-600 hover:underline">{load.broker.companyName || 'Shipper'}</a>
              </div>
            </div>

            {load.podDocumentUrl && (
              <div className="pt-3 border-t border-gray-200">
                <div className="text-[9px] uppercase text-gray-400 font-bold tracking-wider mb-2">Proof of Delivery</div>
                <a href={load.podDocumentUrl} download={`POD-${load.id}.png`} className="block w-full text-center bg-brand-50 text-brand-600 font-bold py-2 rounded-lg border border-brand-200 hover:bg-brand-100 transition-colors text-sm">
                  View / Download POD
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Painel do Mapa com a Rota de Carro */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl min-h-[500px] relative">
          <LiveTrackerMapClient 
            originCity={`${load.originCity}, ${load.originZip}`}
            destCity={`${load.destCity}, ${load.destZip}`}
            currentLat={load.currentLat}
            currentLng={load.currentLng}
            history={load.locationHistory || []}
          />
        </div>

      </div>

      {/* CHAT BOX */}
      {isAuthorized && (
        <div className="max-w-5xl mx-auto mt-6">
          <ChatBox loadId={load.id} currentUserId={userId!} />
        </div>
      )}

      {/* INSPECTION PHOTOS SECTION */}
      {(load.pickupPhotos || load.pickupVinPhoto || load.deliveryPhotos || load.deliveryVinPhoto) && (
        <div className="max-w-5xl mx-auto mt-6 bg-white border border-gray-200 rounded-xl p-6 shadow-xl">
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
  );
}
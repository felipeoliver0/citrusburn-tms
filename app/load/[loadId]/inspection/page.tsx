import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PrintButton from './PrintButton';
import DamageMarker, { DamageMarkerData } from '@/app/components/DamageMarker';

export const dynamic = 'force-dynamic';

export default async function InspectionReportPage({ 
  params 
}: { 
  params: Promise<{ loadId: string }> 
}) {
  const resolvedParams = await params;
  const loadId = resolvedParams.loadId;

  // Busca os dados da carga no banco
  const load = await prisma.load.findUnique({
    where: { id: loadId },
    include: { 
      carrier: true, 
      broker: true,
      inspections: { include: { photos: true, damages: true } }
    }
  });

  if (!load) redirect('/loadboard');

  const pickup = load.inspections.find((i: any) => i.type === 'PICKUP');
  const delivery = load.inspections.find((i: any) => i.type === 'DELIVERY');

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-8 font-sans print:bg-white print:p-0">
      
      {/* CABEÇALHO */}
      <header className="mb-8 border-b border-gray-300 pb-6 flex justify-between items-end max-w-4xl mx-auto print:border-b-2">
        <div>
          <a href="/my-loads" className="text-xs text-brand-600 hover:text-brand-800 transition-colors print:hidden">&larr; Back to Dispatches</a>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mt-2 uppercase">
            Inspection <span className="text-blue-600">Report</span>
          </h1>
          <p className="text-gray-500 mt-1 text-xs font-mono">Load ID: {load.id}</p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p><strong>Route:</strong> {load.originCity} &rarr; {load.destCity}</p>
          <p><strong>Carrier:</strong> {load.carrier?.companyName || 'N/A'}</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-12">
        
        {!pickup && !delivery && (
          <div className="text-center text-gray-500 py-12 bg-white rounded-xl border border-gray-200">
            No inspection reports have been submitted for this load yet.
          </div>
        )}

        {pickup && (
          <section className="bg-white border border-gray-300 rounded-xl p-8 shadow-sm print:shadow-none print:border-none">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <span className="text-2xl">📋</span> Pickup Inspection
            </h2>
            
            <div className="space-y-8">

              {/* Pickup Damages (2D Map) */}
              {pickup.damages && pickup.damages.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <div className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-4 text-center">Visual Condition Report</div>
                  <DamageMarker value={(pickup.damages as any) as DamageMarkerData[]} readOnly />
                </div>
              )}

              <div>
                <div className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-4">Vehicle Photos (Geotagged)</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {pickup.photos.map((photo: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded overflow-hidden aspect-[4/3] relative group">
                      <img src={photo.photoUrl} alt={photo.description || 'Photo'} className="w-full h-full object-cover" />
                      <div className="absolute top-0 left-0 bg-black/60 text-white text-[10px] font-bold uppercase px-2 py-1 m-1 rounded backdrop-blur-sm">
                        {photo.description || 'Photo'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Scanned VIN</div>
                  <div className="text-xl font-mono font-bold text-gray-900 mt-1">{pickup.vin || 'Not provided'}</div>
                </div>
                
                {pickup.signature && (
                  <div>
                    <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-2">Driver eBOL Signature</div>
                    <div className="bg-white border border-gray-300 rounded p-2 inline-block">
                      <img src={pickup.signature} alt="Driver Signature" className="h-16 w-auto mix-blend-multiply" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {delivery && (
          <section className="bg-white border border-gray-300 rounded-xl p-8 shadow-sm print:shadow-none print:border-none print:break-before-page">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <span className="text-2xl">🏁</span> Delivery Inspection
            </h2>
            
            <div className="space-y-8">

              {/* Delivery Damages (2D Map) */}
              {delivery.damages && delivery.damages.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <div className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-4 text-center">Visual Condition Report</div>
                  <DamageMarker value={(delivery.damages as any) as DamageMarkerData[]} readOnly />
                </div>
              )}

              <div>
                <div className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-4">Vehicle Photos (Geotagged)</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {delivery.photos.map((photo: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded overflow-hidden aspect-[4/3] relative group">
                      <img src={photo.photoUrl} alt={photo.description || 'Photo'} className="w-full h-full object-cover" />
                      <div className="absolute top-0 left-0 bg-black/60 text-white text-[10px] font-bold uppercase px-2 py-1 m-1 rounded backdrop-blur-sm">
                        {photo.description || 'Photo'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Scanned VIN</div>
                  <div className="text-xl font-mono font-bold text-gray-900 mt-1">{delivery.vin || 'Not provided'}</div>
                </div>
                
                {delivery.signature && (
                  <div>
                    <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-2">Receiver eBOL Signature</div>
                    <div className="bg-white border border-gray-300 rounded p-2 inline-block">
                      <img src={delivery.signature} alt="Receiver Signature" className="h-16 w-auto mix-blend-multiply" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="max-w-4xl mx-auto mt-8 text-center print:hidden">
        <PrintButton />
      </div>

    </div>
  );
}

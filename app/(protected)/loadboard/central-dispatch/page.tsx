import { searchCentralDispatchLoads } from '@/lib/centralDispatch';
import { MapPin, DollarSign, Calendar, Truck, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { verifySession } from '@/lib/dal';

export default async function CentralDispatchPage({ searchParams }: { searchParams: { origin?: string, dest?: string } }) {
  const session = await verifySession();
  
  // Apenas simulando a busca para a UI
  const loads = await searchCentralDispatchLoads(searchParams.origin, searchParams.dest);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Central Dispatch Integration</h2>
          <p className="text-gray-500 text-sm">Browse loads from the national CD network directly inside AxleGrid.</p>
        </div>
        <Link href="/loadboard" className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 transition-colors">
          Back to AxleGrid Loads
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loads.map(load => (
          <div key={load.id} className="bg-white border border-blue-200 rounded-2xl p-5 hover:border-blue-400 transition-colors shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg">
              Partner Network
            </div>
            
            <div className="flex justify-between items-start mb-4 mt-2">
              <div>
                <div className="text-sm font-bold text-blue-600 mb-1">{load.id}</div>
                <div className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  {load.origin} &rarr; {load.destination}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-emerald-600 flex items-center justify-end">
                  <DollarSign className="w-5 h-5" />{load.price}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                <Truck className="w-4 h-4 text-gray-400" />
                <span className="font-medium truncate">{load.vehicle}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="font-medium truncate">{load.postedBy}</span>
              </div>
            </div>

            <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              Import & Request on Central Dispatch <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      
      <div className="text-center py-10 text-gray-400 text-sm">
        <p>This is a mock interface using the Adapter Pattern.</p>
        <p>Production API Keys will replace this logic in <code className="bg-gray-100 px-2 py-1 rounded text-gray-600">lib/centralDispatch.ts</code>.</p>
      </div>
    </div>
  );
}

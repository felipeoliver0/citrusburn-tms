"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

interface VehicleInput {
  id: number;
  model: string;
  type: string;
  operable: boolean;
}

interface LoadData {
  id: string;
  originCity: string;
  originZip: string;
  destCity: string;
  destZip: string;
  price: number;
  distance: number;
  trailerType: string;
  paymentType: string;
  vehiclesData: any;
}

export default function EditarCarga({ 
  params 
}: { 
  params: Promise<{ loadId: string }> 
}) {
  const router = useRouter();
  const resolvedParams = use(params); // Desembrulha os parâmetros dinâmicos do Next.js
  const loadId = resolvedParams.loadId;

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleInput[]>([]);
  const [loadInfo, setLoadInfo] = useState<LoadData | null>(null);

  // 1. Busca os dados atuais da carga para preencher o formulário
  useEffect(() => {
    async function fetchLoad() {
      try {
        const res = await fetch(`/api/load/details?loadId=${loadId}`);
        if (!res.ok) {
          router.push('/broker-requests');
          return;
        }
        const data = await res.json();
        setLoadInfo(data);

        // Decodifica a lista de veículos vinda do banco
        const initialVehicles = Array.isArray(data.vehiclesData)
          ? data.vehiclesData
          : JSON.parse(data.vehiclesData || '[]');
        
        // Garante que cada veículo tenha um ID único temporário para o React controlar
        setVehicles(initialVehicles.map((v: any, index: number) => ({
          id: v.id || Date.now() + index,
          model: v.model || '',
          type: v.type || 'Sedan',
          operable: v.operable ?? true
        })));
        
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar detalhes da carga:", err instanceof Error ? err.message : 'Unknown error');
        router.push('/broker-requests');
      }
    }
    fetchLoad();
  }, [loadId, router]);

  // Funções dinâmicas da lista de veículos
  const addVehicleField = () => {
    setVehicles([...vehicles, { id: Date.now(), model: '', type: 'Sedan', operable: true }]);
  };

  const removeVehicleField = (id: number) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter(v => v.id !== id));
    }
  };

  const updateVehicle = (id: number, key: keyof VehicleInput, value: any) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, [key]: value } : v));
  };

  // Envio dos dados atualizados para salvar
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload = {
      loadId,
      originCity: formData.get('originCity'),
      originZip: formData.get('originZip'),
      destCity: formData.get('destCity'),
      destZip: formData.get('destZip'),
      price: parseFloat(formData.get('price') as string),
      distance: parseFloat(formData.get('distance') as string),
      trailerType: formData.get('trailerType'),
      paymentType: formData.get('paymentType'),
      vehiclesList: vehicles // Envia o novo array de carros editados
    };

    try {
      const res = await fetch('/api/load/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        router.push('/broker-requests');
        router.refresh();
      }
    } catch (err) {
      console.error("Erro ao atualizar a carga:", err instanceof Error ? err.message : 'Unknown error');
    }
  }

  if (loading || !loadInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-400 font-mono">
        🔄 Loading dispatch details from database...
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
        
        <div className="bg-gray-50/50 p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Load Listing</h1>
            <p className="text-xs text-gray-500 mt-1">Make adjustments to the inventory and pricing</p>
          </div>
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
            Edit Mode
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">

          {/* Seção 1: Rota e Valores */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-brand-500 uppercase tracking-wider border-b border-gray-200 pb-2">1. Route & Rate</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Origin City</label>
                <input type="text" name="originCity" defaultValue={loadInfo.originCity} required className="w-full bg-gray-50 border border-gray-300 rounded p-2.5 text-sm text-gray-900 focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Origin Zip</label>
                <input type="text" name="originZip" defaultValue={loadInfo.originZip} required className="w-full bg-gray-50 border border-gray-300 rounded p-2.5 text-sm text-gray-900 focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Destination City</label>
                <input type="text" name="destCity" defaultValue={loadInfo.destCity} required className="w-full bg-gray-50 border border-gray-300 rounded p-2.5 text-sm text-gray-900 focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Destination Zip</label>
                <input type="text" name="destZip" defaultValue={loadInfo.destZip} required className="w-full bg-gray-50 border border-gray-300 rounded p-2.5 text-sm text-gray-900 focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Total Pay ($)</label>
                <input type="number" step="0.01" name="price" defaultValue={loadInfo.price} required className="w-full bg-gray-50 border border-gray-300 rounded p-2.5 text-sm font-bold text-brand-600 focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Distance (Miles)</label>
                <input type="number" step="0.1" name="distance" defaultValue={loadInfo.distance} required className="w-full bg-gray-50 border border-gray-300 rounded p-2.5 text-sm text-gray-900 focus:outline-none focus:border-brand-500" />
              </div>
            </div>
          </div>

          {/* Seção 2: Inventário de Veículos */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <h2 className="text-xs font-bold text-blue-500 uppercase tracking-wider">2. Vehicles Inventory</h2>
              <button type="button" onClick={addVehicleField} className="text-[10px] bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold px-3 py-1 rounded hover:bg-blue-600 hover:text-gray-900 transition-all">+ Add Vehicle</button>
            </div>
            <div className="space-y-3">
              {vehicles.map((v, i) => (
                <div key={v.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                    <span>VEHICLE #{i + 1}</span>
                    {vehicles.length > 1 && <button type="button" onClick={() => removeVehicleField(v.id)} className="text-red-400 underline">Remove</button>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" placeholder="Year, Make, Model" value={v.model} onChange={e => updateVehicle(v.id, 'model', e.target.value)} required className="bg-white border border-gray-300 rounded p-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none" />
                    <select value={v.type} onChange={e => updateVehicle(v.id, 'type', e.target.value)} className="bg-white border border-gray-300 rounded p-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none">
                      <option value="Sedan">🚗 Sedan</option>
                      <option value="SUV">🚙 SUV</option>
                      <option value="Pickup Truck">🛻 Pickup</option>
                      <option value="Van">Vans</option>
                    </select>
                    <select value={v.operable ? "true" : "false"} onChange={e => updateVehicle(v.id, 'operable', e.target.value === 'true')} className="bg-white border border-gray-300 rounded p-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none">
                      <option value="true">🟢 Runs</option>
                      <option value="false">🔴 Inop</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 3: Carreta e Pagamento */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
            <div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">3. Trailer Type</h2>
              <select name="trailerType" defaultValue={loadInfo.trailerType} className="w-full bg-gray-50 border border-gray-300 rounded p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none">
                <option value="OPEN">🛣️ Open Trailer</option>
                <option value="ENCLOSED">🔒 Enclosed</option>
              </select>
            </div>
            <div>
              <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">4. Payment Terms</h2>
              <select name="paymentType" defaultValue={loadInfo.paymentType} className="w-full bg-gray-50 border border-gray-300 rounded p-2.5 text-xs text-amber-500 font-bold focus:border-amber-500 focus:outline-none">
                <option value="COD">💵 COD (Cash on Delivery)</option>
                <option value="QUICKPAY">⚡ QuickPay (2-5 days)</option>
                <option value="STANDARD">📅 Standard (Net 30)</option>
                <option value="COP">💰 COP (Cash on Pickup)</option>
                <option value="CHECK">🧾 Check</option>
              </select>
            </div>
          </div>

          <div className="pt-6 flex justify-between items-center border-t border-gray-200">
            <a href="/broker-requests" className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">Cancel</a>
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-gray-900 font-bold py-3 px-10 rounded-xl transition-all text-sm uppercase tracking-wider shadow-lg">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
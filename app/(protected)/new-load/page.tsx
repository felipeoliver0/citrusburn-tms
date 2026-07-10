"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, DollarSign, Truck, Car, Plus, Trash2, Banknote, Navigation } from 'lucide-react';

interface VehicleInput {
  id: number;
  model: string;
  type: string;
  operable: boolean;
}

export default function NovaCarga() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<VehicleInput[]>([
    { id: Date.now(), model: '', type: 'Sedan', operable: true }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);

      const payload = {
        originAddress: formData.get('originAddress') as string,
        originCity: formData.get('originCity') as string,
        originZip: formData.get('originZip') as string,
        destAddress: formData.get('destAddress') as string,
        destCity: formData.get('destCity') as string,
        destZip: formData.get('destZip') as string,
        price: parseFloat(formData.get('price') as string),
        distance: parseFloat(formData.get('distance') as string),
        trailerType: formData.get('trailerType') as string,
        paymentType: formData.get('paymentType') as string,
        pickupDate: formData.get('pickupDate') as string,
        deliveryDate: formData.get('deliveryDate') as string,
        vehiclesList: vehicles 
      };

      const res = await fetch('/api/load/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        router.push('/loadboard');
        router.refresh();
      } else {
        const errorData = await res.json();
        alert("Server Error: " + (errorData.error || "Failed to save to database."));
      }
    } catch (err: any) {
      alert("Browser code error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Common Input Style for dark theme
  const inputStyle = "w-full bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-inner";
  const labelStyle = "flex items-center gap-2 text-[11px] uppercase text-gray-400 font-bold mb-1.5 tracking-wider";

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 md:p-8 bg-gray-950 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">
            Post a New Load
          </h1>
          <p className="text-sm text-gray-400 mt-2 max-w-xl">
            Create a highly visible listing on the loadboard. Fill in the specifics to match with the best carriers in our network.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1: Route & Dates */}
          <div className="bg-gray-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
              <div className="bg-brand-500/20 p-2 rounded-lg">
                <Navigation className="w-5 h-5 text-brand-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-100">Route & Schedule</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Origin */}
              <div className="space-y-4 bg-gray-800/30 p-4 rounded-xl border border-white/5">
                <div>
                  <label className={labelStyle}><MapPin className="w-3 h-3 text-emerald-400" /> Origin Address (Hidden)</label>
                  <input type="text" name="originAddress" required className={inputStyle} placeholder="123 Main St, Suite 100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Origin City</label>
                    <input type="text" name="originCity" required className={inputStyle} placeholder="Orlando, FL" />
                  </div>
                  <div>
                    <label className={labelStyle}>Origin Zip</label>
                    <input type="text" name="originZip" required className={inputStyle} placeholder="34787" />
                  </div>
                </div>
                <div>
                  <label className={labelStyle}><Calendar className="w-3 h-3" /> Pickup Date</label>
                  <input type="date" name="pickupDate" required className={`${inputStyle} [color-scheme:dark]`} />
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-4 bg-gray-800/30 p-4 rounded-xl border border-white/5">
                <div>
                  <label className={labelStyle}><MapPin className="w-3 h-3 text-rose-400" /> Destination Address (Hidden)</label>
                  <input type="text" name="destAddress" required className={inputStyle} placeholder="456 Delivery Ave" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Dest City</label>
                    <input type="text" name="destCity" required className={inputStyle} placeholder="Miami, FL" />
                  </div>
                  <div>
                    <label className={labelStyle}>Dest Zip</label>
                    <input type="text" name="destZip" required className={inputStyle} placeholder="33101" />
                  </div>
                </div>
                <div>
                  <label className={labelStyle}><Calendar className="w-3 h-3" /> Delivery Date</label>
                  <input type="date" name="deliveryDate" required className={`${inputStyle} [color-scheme:dark]`} />
                </div>
              </div>

            </div>

            {/* Rates & Distance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className={labelStyle}><DollarSign className="w-3 h-3 text-emerald-400" /> Total Pay</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-emerald-500 font-bold">$</span>
                  </div>
                  <input type="number" step="0.01" name="price" required className={`${inputStyle} pl-8 text-emerald-400 font-bold text-lg`} placeholder="400.00" />
                </div>
              </div>
              <div>
                <label className={labelStyle}><Navigation className="w-3 h-3" /> Total Distance (Miles)</label>
                <input type="number" step="0.1" name="distance" required className={inputStyle} placeholder="230" />
              </div>
            </div>
          </div>

          {/* Section 2: Vehicles Inventory */}
          <div className="bg-gray-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <Car className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-100">Vehicles Inventory</h2>
              </div>
              <button 
                type="button" 
                onClick={addVehicleField} 
                className="flex items-center gap-2 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Vehicle
              </button>
            </div>
            
            <div className="space-y-4">
              {vehicles.map((v, i) => (
                <div key={v.id} className="group flex flex-col md:flex-row items-center gap-4 bg-gray-800/30 border border-gray-700/50 hover:border-gray-600 rounded-xl p-4 transition-all">
                  <div className="w-full md:w-auto flex-1">
                    <input 
                      type="text" 
                      placeholder="Year, Make, Model (e.g. 2023 Tesla Model 3)" 
                      value={v.model} 
                      onChange={e => updateVehicle(v.id, 'model', e.target.value)} 
                      required 
                      className={inputStyle} 
                    />
                  </div>
                  <div className="w-full md:w-auto flex gap-4">
                    <select 
                      value={v.type} 
                      onChange={e => updateVehicle(v.id, 'type', e.target.value)} 
                      className={`${inputStyle} md:w-40 appearance-none`}
                    >
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="Pickup">Pickup</option>
                      <option value="Van">Van</option>
                    </select>
                    <select 
                      value={v.operable ? "true" : "false"} 
                      onChange={e => updateVehicle(v.id, 'operable', e.target.value === 'true')} 
                      className={`${inputStyle} md:w-32 appearance-none`}
                    >
                      <option value="true">🟢 Runs</option>
                      <option value="false">🔴 Inop</option>
                    </select>
                    
                    {vehicles.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeVehicleField(v.id)} 
                        className="p-3 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                        title="Remove vehicle"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Trailer & Payment */}
          <div className="bg-gray-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-500/20 p-2 rounded-lg">
                    <Truck className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-100">Trailer Requirements</h2>
                </div>
                <select name="trailerType" className={`${inputStyle} appearance-none`}>
                  <option value="OPEN">Open Trailer</option>
                  <option value="ENCLOSED">Enclosed Trailer (Premium)</option>
                </select>
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-amber-500/20 p-2 rounded-lg">
                    <Banknote className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-100">Payment Terms</h2>
                </div>
                <select name="paymentType" className={`${inputStyle} appearance-none text-amber-400 font-bold`}>
                  <option value="COD">COD (Cash on Delivery)</option>
                  <option value="QUICKPAY">QuickPay (2-5 days)</option>
                  <option value="STANDARD">Standard (Net 30)</option>
                  <option value="COP">COP (Cash on Pickup)</option>
                  <option value="CHECK">Check</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="w-full md:w-auto px-6 py-3 text-gray-400 font-bold hover:text-white hover:bg-gray-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full md:w-auto relative group overflow-hidden rounded-xl bg-brand-600 px-10 py-4 font-bold text-white shadow-[0_0_40px_-10px_rgba(234,88,12,0.5)] transition-all hover:scale-[1.02] hover:shadow-[0_0_60px_-15px_rgba(234,88,12,0.7)] disabled:opacity-50 disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-amber-500 opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="relative flex items-center gap-2 uppercase tracking-wider text-sm">
                {isSubmitting ? 'Posting...' : 'Publish Load'} <Navigation className="w-4 h-4" />
              </span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

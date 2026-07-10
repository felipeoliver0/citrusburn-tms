'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Target, Search, X, Save, Bookmark, Route, Truck, CreditCard } from 'lucide-react';
import { saveSearchAction, deleteSearchAction } from './searchActions';

// List of US States for the dropdown
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function SearchSidebar({ savedSearches }: { savedSearches: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [origin, setOrigin] = useState(searchParams.get('origin') || '');
  const [originState, setOriginState] = useState(searchParams.get('originState') || '');
  const [dest, setDest] = useState(searchParams.get('dest') || '');
  const [destState, setDestState] = useState(searchParams.get('destState') || '');
  const [maxMiles, setMaxMiles] = useState(searchParams.get('maxMiles') || '');
  const [trailerType, setTrailerType] = useState(searchParams.get('trailerType') || '');
  const [paymentType, setPaymentType] = useState(searchParams.get('paymentType') || '');

  const buildParams = (ov?: string, dv?: string, mm?: string) => {
    const params = new URLSearchParams();
    const o = ov ?? origin.trim();
    const d = dv ?? dest.trim();
    const mv = mm ?? maxMiles;
    if (o) params.set('origin', o);
    if (originState) params.set('originState', originState);
    if (d) params.set('dest', d);
    if (destState) params.set('destState', destState);
    if (mv) params.set('maxMiles', mv);
    if (trailerType) params.set('trailerType', trailerType);
    if (paymentType) params.set('paymentType', paymentType);
    return params.toString();
  };

  const handleSearch = () => {
    router.push(`/loadboard?${buildParams()}`);
  };

  const handleClear = () => {
    setOrigin('');
    setOriginState('');
    setDest('');
    setDestState('');
    setMaxMiles('');
    setTrailerType('');
    setPaymentType('');
    router.push('/loadboard');
  };

  const applySavedSearch = (sOrigin: string | null, sDest: string | null) => {
    setOrigin(sOrigin || '');
    setOriginState('');
    setDest(sDest || '');
    setDestState('');
    setMaxMiles('');
    const params = new URLSearchParams();
    if (sOrigin) params.set('origin', sOrigin);
    if (sDest) params.set('dest', sDest);
    router.push(`/loadboard?${params.toString()}`);
  };

  const activeFilters = [origin, originState, dest, destState, maxMiles, trailerType, paymentType].filter(Boolean).length;

  return (
    <aside className="w-80 shrink-0 space-y-6 hidden lg:block sticky top-24 self-start h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar pr-2 pb-10">
      
      {/* Current Search */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm relative">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Search size={16} className="text-brand-500" /> Filters</h3>
          {activeFilters > 0 && <span className="text-[10px] font-bold bg-brand-50 text-brand-600 px-2 py-1 rounded-full border border-brand-100">{activeFilters} active</span>}
        </div>
        
        <div className="p-5 space-y-5">
          {/* Origin Section */}
          <div className="space-y-3">
            <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider">Origin</label>
            <div className="relative flex items-center">
              <MapPin size={16} className="absolute left-3 text-brand-500" />
              <input 
                type="text" 
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="City or Zip"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder:text-gray-400 transition-colors"
              />
            </div>
            <select 
              value={originState}
              onChange={e => setOriginState(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 appearance-none cursor-pointer transition-colors"
            >
              <option value="">Any State</option>
              {US_STATES.map(state => <option key={state} value={state}>{state}</option>)}
            </select>
          </div>

          <hr className="border-gray-100" />

          {/* Destination Section */}
          <div className="space-y-3">
            <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider">Destination</label>
            <div className="relative flex items-center">
              <Target size={16} className="absolute left-3 text-green-500" />
              <input 
                type="text" 
                value={dest}
                onChange={e => setDest(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="City or Zip"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 placeholder:text-gray-400 transition-colors"
              />
            </div>
            <select 
              value={destState}
              onChange={e => setDestState(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none cursor-pointer transition-colors"
            >
              <option value="">Any State</option>
              {US_STATES.map(state => <option key={state} value={state}>{state}</option>)}
            </select>
          </div>

          <hr className="border-gray-100" />

          {/* Max Miles Section */}
          <div className="space-y-3">
            <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider">Max Distance</label>
            <div className="relative flex items-center">
              <Route size={16} className="absolute left-3 text-purple-500" />
              <input 
                type="number" 
                value={maxMiles}
                onChange={e => setMaxMiles(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Maximum miles (e.g. 500)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-gray-400 transition-colors"
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Equipment & Payment Section */}
          <div className="space-y-3">
            <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider">Equipment & Payment</label>
            <div className="relative flex items-center">
              <Truck size={16} className="absolute left-3 text-orange-500 z-10" />
              <select 
                value={trailerType}
                onChange={e => setTrailerType(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 appearance-none cursor-pointer transition-colors relative"
              >
                <option value="">Any Trailer</option>
                <option value="OPEN">Open Carrier</option>
                <option value="ENCLOSED">Enclosed Carrier</option>
              </select>
            </div>
            
            <div className="relative flex items-center">
              <CreditCard size={16} className="absolute left-3 text-blue-500 z-10" />
              <select 
                value={paymentType}
                onChange={e => setPaymentType(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer transition-colors relative"
              >
                <option value="">Any Payment</option>
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="COP">Cash on Pickup (COP)</option>
                <option value="QUICKPAY">Quickpay</option>
                <option value="TERM">Term (30/60/90 Days)</option>
              </select>
            </div>
          </div>

          <button onClick={handleSearch} className="w-full bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2">
            <Search size={16} /> Search Loads
          </button>
          
          <button onClick={handleClear} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold py-2.5 rounded-xl transition-colors">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Saved Searches */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Bookmark size={16} className="text-purple-500" /> Saved Searches</h3>
          <span className="text-xs text-gray-400 font-medium">{savedSearches.length}</span>
        </div>
        <div className="p-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
          {savedSearches.length === 0 ? (
            <div className="text-xs text-gray-400 italic p-3 text-center">No saved searches yet. Click 'Save' above to add one.</div>
          ) : (
            savedSearches.map(search => (
              <div 
                key={search.id}
                onClick={() => applySavedSearch(search.originCity, search.destCity)}
                className="text-xs font-medium text-gray-700 p-3 bg-gray-50 hover:bg-gray-100 border-l-2 border-brand-500 cursor-pointer flex justify-between items-center rounded-r-xl transition-colors group"
              >
                <span className="truncate pr-2">{search.name}</span>
                <button 
                  onClick={async (e) => { e.stopPropagation(); await deleteSearchAction(search.id); }}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

import { useState } from 'react';
import { requestLoadAction } from './actions';
import { Truck, Navigation, Phone, ShieldCheck, DollarSign, Calendar, Info } from 'lucide-react';
import { getSuggestedRate, getRateBadge } from '@/lib/pricing';

export default function LoadCard({ load, currentUser, isPending }: { load: any, currentUser: any, isPending: boolean }) {
  const [isRequestModalOpen, setRequestModalOpen] = useState(false);
  const [bidPrice, setBidPrice] = useState<string>(load.price.toString());
  const [isLoading, setIsLoading] = useState(false);

  const rpm = load.distance > 0 ? (load.price / load.distance).toFixed(2) : '0.00';
  
  let buttonText = 'REQUEST LOAD';
  let buttonClass = 'bg-brand-600 hover:bg-brand-500 text-white';
  let isDisabled = false;

  if (currentUser.role === 'BROKER' && load.brokerId === currentUser.id) {
    buttonText = 'MY LISTING';
    buttonClass = 'bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5';
    isDisabled = true;
  } else if (isPending) {
    buttonText = 'BID SUBMITTED';
    buttonClass = 'bg-amber-500/20 text-amber-500 cursor-not-allowed border border-amber-500/30';
    isDisabled = true;
  }

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const numericBid = parseFloat(bidPrice);
    await requestLoadAction(load.id, isNaN(numericBid) ? null : numericBid);
    setIsLoading(false);
    setRequestModalOpen(false);
  };

  const vehicleArray = Array.isArray(load.vehiclesData) ? load.vehiclesData : JSON.parse(load.vehiclesData as string || '[]');

  const suggestedRate = getSuggestedRate(load.distance);
  const badge = getRateBadge(load.price, suggestedRate);

  return (
    <>
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-brand-300 transition-all duration-300 relative group flex flex-col h-full overflow-hidden">
        
        {/* Decoração superior */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

        {/* HEADER: Preço, Milhas e Rate Badge */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              ${load.price.toLocaleString()}
              {badge && (
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md border ${badge.color}`}>
                  {badge.label}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 font-medium mt-1 flex items-center gap-2">
              <span>{load.distance.toLocaleString()} mi</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span>${rpm}/mi</span>
            </div>
            <div className="mt-2 flex gap-2">
              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded uppercase flex items-center gap-1">
                <DollarSign size={10} /> {load.paymentType}
              </span>
            </div>
          </div>
        </div>

        {/* Body Container for Desktop Row Layout */}
        <div className="flex flex-col xl:flex-row gap-6 xl:gap-0 flex-1">
          {/* Route Block */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-500 shadow-sm"></div>
                <div className="w-0.5 h-8 bg-gradient-to-b from-brand-300 to-green-300"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm"></div>
              </div>
              <div className="flex flex-col justify-between h-full space-y-3">
                <div>
                  <div className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Pick-up</div>
                  <div className="text-base font-bold text-gray-800 leading-tight">{load.originCity} <span className="text-gray-500 font-normal ml-1 text-xs">{load.originZip}</span></div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Delivery</div>
                  <div className="text-base font-bold text-gray-800 leading-tight">{load.destCity} <span className="text-gray-500 font-normal ml-1 text-xs">{load.destZip}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Details Block */}
          <div className="w-full xl:w-48 shrink-0 flex flex-col justify-center space-y-2 xl:px-4 xl:border-l border-gray-100 pt-4 xl:pt-0">
            <div>
              <div className="text-[9px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">Company</div>
              <div className="text-xs font-bold text-gray-800 flex items-center gap-1">
                <ShieldCheck size={12} className="text-brand-500" />
                <span className="truncate">{load.broker.companyName || 'Independent Shipper'}</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                <Phone size={10} /> {load.broker.phone || 'View upon request'}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">Vehicles ({vehicleArray.length})</div>
              <div className="text-[10px] text-gray-600 font-medium truncate">
                {vehicleArray.slice(0, 2).map((v: any) => v.make || v.model).join(', ')} {vehicleArray.length > 2 ? `+${vehicleArray.length - 2}` : ''}
              </div>
            </div>
          </div>

          {/* Action Block */}
          <div className="w-full xl:w-32 shrink-0 flex flex-col justify-between h-full border-t xl:border-t-0 xl:border-l border-gray-100 pt-4 xl:pt-0 xl:pl-4">
            <div className="space-y-1.5 mb-3 flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase text-gray-400 font-bold">PU:</span>
                <span className="text-[10px] text-brand-600 font-bold">{load.pickupDate ? new Date(load.pickupDate).toLocaleDateString('en-US') : 'ASAP'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase text-gray-400 font-bold">DEL:</span>
                <span className="text-[10px] text-green-600 font-bold">{load.deliveryDate ? new Date(load.deliveryDate).toLocaleDateString('en-US') : 'TBD'}</span>
              </div>
            </div>

            <button 
              disabled={isDisabled}
              onClick={() => !isDisabled && setRequestModalOpen(true)}
              className={`w-full text-[10px] uppercase tracking-wider font-bold py-3 rounded-xl transition-all shadow-sm mt-auto ${buttonClass}`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>

      {/* REQUEST MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-gray-100 rounded-[2rem] w-full max-w-md shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden animate-fade-in-up">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white">
              <h3 className="font-black text-gray-900 tracking-tight text-xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                  <Navigation size={16} className="rotate-45 ml-0.5" />
                </div>
                Request Load
              </h3>
              <button 
                onClick={() => setRequestModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleRequestSubmit} className="p-8">
              {/* Load Info */}
              <div className="text-center mb-8">
                <div className="inline-block px-4 py-1.5 bg-green-50 text-green-700 text-xs font-black tracking-widest uppercase rounded-full mb-3">
                  Target Price
                </div>
                <div className="text-5xl font-black text-gray-900 tracking-tighter mb-2">
                  ${load.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm font-medium text-gray-500 flex items-center justify-center gap-2">
                  <span>{load.distance.toLocaleString()} mi</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>{load.originCity} &rarr; {load.destCity}</span>
                </div>
              </div>

              {/* Input Area */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">
                  Your Bid Price
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                    <DollarSign size={20} className="text-brand-500 font-black" />
                  </div>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={bidPrice}
                    onChange={e => setBidPrice(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-gray-100 hover:border-gray-200 focus:bg-white focus:border-brand-500 rounded-2xl py-4 pl-12 pr-6 text-3xl font-black text-gray-900 outline-none transition-all focus:ring-4 focus:ring-brand-500/10 shadow-inner"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-400 font-medium mt-3 text-center">
                  Bidding lower than target increases your chances of winning.
                </p>
              </div>

              {/* Action Button */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="relative w-full bg-gray-900 hover:bg-black text-white font-bold text-lg py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden shadow-xl shadow-gray-900/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? 'Submitting...' : 'Submit Request & Bid'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

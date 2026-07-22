import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import { redirect } from 'next/navigation';
import { approveRequestAction, rejectRequestAction } from './actions';
import { ShieldCheck, MapPin, Target, DollarSign, Clock, X, Check } from 'lucide-react';
import AutoRefresh from '@/app/components/AutoRefresh';

export default async function BrokerRequests() {
  const { userId } = await verifySession();

  const currentUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!currentUser || currentUser.role !== 'BROKER') {
    return (
      <div className="p-8 text-gray-900">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-gray-500 mt-2">Only Shippers can access incoming requests.</p>
      </div>
    );
  }

  // Fetch all pending load requests where the load belongs to the broker
  const requests = await prisma.loadRequest.findMany({
    where: {
      load: { brokerId: userId },
      status: 'PENDING'
    },
    include: {
      load: true,
      carrier: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8 animate-fade-in text-gray-900 p-6 md:p-8">
      <AutoRefresh intervalMs={30000} />
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-gray-900">
          <ShieldCheck className="text-brand-500" size={32} />
          Carrier Requests
        </h1>
        <p className="text-gray-500 mt-2 text-sm font-medium">Review and approve carrier requests to book your loads.</p>
      </header>

      {requests.length === 0 ? (
        <div className="border border-gray-200 rounded-3xl p-12 bg-white text-center flex flex-col items-center shadow-sm">
           <Clock size={48} className="text-gray-300 mb-4" />
           <h3 className="text-lg font-bold text-gray-800">No pending requests</h3>
           <p className="text-gray-500 text-sm mt-2 font-medium">When carriers request to book your loads, they will appear here for your approval.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => {
            const isCounterOffer = req.bidPrice && req.bidPrice !== req.load.price;
            
            return (
            <div key={req.id} className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col group">
              
              {/* Carrier Info */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                 <div className="h-14 w-14 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center font-black text-xl shrink-0 border border-brand-100 shadow-inner">
                   {req.carrier.companyName?.charAt(0) || 'C'}
                 </div>
                 <div>
                   <a href={`/profile/${req.carrier.id}`} className="font-bold text-gray-900 text-lg leading-tight hover:text-brand-600 hover:underline transition-colors">{req.carrier.companyName || req.carrier.fullName}</a>
                   <p className="text-xs text-gray-500 mt-1 font-medium flex items-center gap-1">MC: <span className="font-bold text-gray-700">{req.carrier.mcNumber || 'N/A'}</span></p>
                 </div>
              </div>

              {/* Load Info */}
              <div className="space-y-3 mb-6 flex-1 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 flex justify-center"><MapPin size={18} className="text-gray-400" /></div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-brand-600 tracking-wider">Origin</p>
                    <p className="text-base font-bold text-gray-800">{req.load.originCity}</p>
                  </div>
                </div>
                
                <div className="h-6 border-l-2 border-dotted border-gray-200 ml-3"></div>

                <div className="flex items-center gap-3">
                  <div className="w-6 flex justify-center"><Target size={18} className="text-brand-500" /></div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-green-600 tracking-wider">Destination</p>
                    <p className="text-base font-bold text-gray-800">{req.load.destCity}</p>
                  </div>
                </div>

                {/* Offer Box */}
                <div className={`rounded-2xl p-4 mt-6 flex items-center justify-between border ${isCounterOffer ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                  <span className={`text-xs font-black uppercase tracking-wider ${isCounterOffer ? 'text-amber-700' : 'text-gray-500'}`}>
                    {isCounterOffer ? 'Counter Offer' : 'Agreed Rate'}
                  </span>
                  <span className={`text-2xl font-black flex items-center ${isCounterOffer ? 'text-amber-600' : 'text-gray-900'}`}>
                    <DollarSign size={20} className="mr-0.5 opacity-80" />
                    {(req.bidPrice || req.load.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-auto pt-2">
                <form action={rejectRequestAction} className="flex-1">
                  <input type="hidden" name="requestId" value={req.id} />
                  <button type="submit" className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-white text-gray-600 transition-all border-2 border-gray-100 hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                    <X size={18} /> Reject
                  </button>
                </form>

                <form action={approveRequestAction} className="flex-[1.5]">
                  <input type="hidden" name="requestId" value={req.id} />
                  <button type="submit" className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25 transition-all hover:-translate-y-0.5">
                    <Check size={18} /> Approve
                  </button>
                </form>
              </div>

            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

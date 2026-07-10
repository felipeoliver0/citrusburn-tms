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
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <ShieldCheck className="text-purple-400" size={32} />
          Carrier <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-brand-400">Requests</span>
        </h1>
        <p className="text-gray-500 mt-2 text-sm">Review and approve carrier requests to book your loads.</p>
      </header>

      {requests.length === 0 ? (
        <div className="glass-panel border border-gray-100 rounded-3xl p-12 bg-white text-center flex flex-col items-center">
           <Clock size={48} className="text-zinc-600 mb-4" />
           <h3 className="text-lg font-bold text-gray-900">No pending requests</h3>
           <p className="text-gray-500 text-sm mt-2">When carriers request to book your loads, they will appear here for your approval.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => (
            <div key={req.id} className="glass-panel border border-gray-100 rounded-3xl p-6 shadow-xl bg-white relative overflow-hidden flex flex-col">
              
              {/* Carrier Info */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                 <div className="h-12 w-12 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center font-bold text-lg shrink-0 border border-purple-500/30">
                   {req.carrier.companyName?.charAt(0) || 'C'}
                 </div>
                 <div>
                   <a href={`/profile/${req.carrier.id}`} className="font-bold text-gray-900 text-lg leading-tight hover:text-purple-400 hover:underline">{req.carrier.companyName || req.carrier.fullName}</a>
                   <p className="text-xs text-gray-500 mt-1">MC: {req.carrier.mcNumber || 'N/A'}</p>
                 </div>
              </div>

              {/* Load Info */}
              <div className="space-y-4 mb-6 flex-1">
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-brand-400" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Origin</p>
                    <p className="text-sm font-medium">{req.load.originCity}</p>
                  </div>
                </div>
                
                <div className="h-4 border-l-2 border-dashed border-zinc-700 ml-1.5 my-1"></div>

                <div className="flex items-center gap-3">
                  <Target size={16} className="text-green-400" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Destination</p>
                    <p className="text-sm font-medium">{req.load.destCity}</p>
                  </div>
                </div>

                <div className="bg-black/30 rounded-xl p-3 mt-4 border border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-bold uppercase">{req.bidPrice && req.bidPrice !== req.load.price ? 'Counter Offer' : 'Agreed Rate'}</span>
                  <span className="font-bold text-green-400 flex items-center"><DollarSign size={14}/>{(req.bidPrice || req.load.price).toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-auto">
                <form action={rejectRequestAction} className="flex-1">
                  <input type="hidden" name="requestId" value={req.id} />
                  <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-gray-50 hover:bg-red-500/20 hover:text-red-400 text-gray-600 transition-colors border border-transparent hover:border-red-500/30">
                    <X size={16} /> Reject
                  </button>
                </form>

                <form action={approveRequestAction} className="flex-[2]">
                  <input type="hidden" name="requestId" value={req.id} />
                  <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-gray-900 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all">
                    <Check size={16} /> Approve
                  </button>
                </form>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Truck, MapPin, Trash2 } from 'lucide-react';
import DriverForm from './DriverForm';
import { deleteDriverAction } from './actions';
import SubscriptionRequired from '../loadboard/SubscriptionRequired';
import { hasActiveSubscription, isSubscriptionRequired } from '@/lib/subscription';

export default async function FleetManagement() {
  const { userId } = await verifySession();

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { fleetDrivers: true }
  });

  if (!currentUser || currentUser.role !== 'CARRIER') {
    return (
      <div className="p-8 text-gray-800">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-gray-500 mt-2">Only Carriers can access Fleet Management.</p>
      </div>
    );
  }

  if (
    isSubscriptionRequired(currentUser.role) &&
    !hasActiveSubscription({
      role: currentUser.role,
      subscriptionStatus: currentUser.subscriptionStatus,
      trialEndsAt: currentUser.trialEndsAt,
      subscriptionEndsAt: currentUser.subscriptionEndsAt,
    })
  ) {
    return <SubscriptionRequired trialExpired={currentUser.subscriptionStatus === 'TRIAL'} />;
  }

  return (
    <div className="space-y-8 animate-fade-in text-gray-900 p-6 md:p-8">
      
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-gray-800">
            <Truck className="text-brand-500" size={32} />
            Fleet Management
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Add and manage your drivers to dispatch loads efficiently.</p>
        </div>
        
        <Link 
          href="/fleet/map"
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-gray-900/20"
        >
          <MapPin size={18} /> Global Control Tower
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ADD DRIVER FORM */}
        <div className="lg:col-span-1">
          <DriverForm />
        </div>

        {/* DRIVER LIST */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold mb-2 text-gray-800">My Drivers ({currentUser.fleetDrivers.length})</h2>
          
          {currentUser.fleetDrivers.length === 0 ? (
             <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center text-gray-500 shadow-sm">
               No drivers registered yet. Add one to start dispatching loads!
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentUser.fleetDrivers.map((driver) => {
                const deleteWithId = deleteDriverAction.bind(null, driver.id);
                return (
                  <div key={driver.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 hover:border-brand-300 hover:shadow-md transition-all shadow-sm">
                    <div className="h-12 w-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                      {driver.fullName?.charAt(0) || 'D'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 truncate">{driver.fullName}</h3>
                      <p className="text-xs text-gray-500 truncate">{driver.email}</p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider flex items-center gap-1">
                        <MapPin size={10} /> {driver.phone || 'No phone'}
                      </p>
                    </div>
                    <form action={deleteWithId}>
                      <button type="submit" className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Remove Driver">
                        <Trash2 size={18} />
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

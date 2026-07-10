import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import DownloadContractButton from '@/app/components/DownloadContractButton';
import GenerateInvoiceButton from '@/app/components/GenerateInvoiceButton';
import DownloadBOLButton from '@/app/components/DownloadBOLButton';
import { createNotification } from '@/lib/notifications';
import AutoRefresh from '@/app/components/AutoRefresh';
import FilterBar from './components/FilterBar';
import Link from 'next/link';
import { verifySession, getSession } from '@/lib/dal';
import { z } from 'zod';

const PAGE_SIZE = 10;

export default async function MyLoads(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const currentPage = isNaN(page) || page < 1 ? 1 : page;
  const skip = (currentPage - 1) * PAGE_SIZE;

  const { userId } = await verifySession();

  const currentUser = await prisma.user.findUnique({ 
    where: { id: userId },
    select: {
      id: true,
      role: true,
      companyName: true,
      fullName: true,
      fleetDrivers: { select: { id: true, fullName: true } },
    }
  });
  if (!currentUser) redirect('/login');

  const isBroker = currentUser.role === 'BROKER';

  const filterCompanyId = typeof searchParams.companyId === 'string' ? searchParams.companyId : undefined;
  const filterStatus = typeof searchParams.status === 'string' ? searchParams.status : undefined;

  const baseWhere: any = isBroker ? { brokerId: userId } : { carrierId: userId };
  
  if (filterCompanyId) {
    if (isBroker) baseWhere.carrierId = filterCompanyId;
    else baseWhere.brokerId = filterCompanyId;
  }
  
  if (filterStatus) {
    baseWhere.status = filterStatus;
  }

  const myLoads = await prisma.load.findMany({
    where: baseWhere,
    select: {
      id: true,
      originCity: true,
      originZip: true,
      originAddress: true,
      destCity: true,
      destZip: true,
      destAddress: true,
      price: true,
      distance: true,
      status: true,
      pickupDate: true,
      deliveryDate: true,
      vehiclesData: true,
      trailerType: true,
      paymentType: true,
      pickupVin: true,
      deliveryVin: true,
      pickupDamages: true,
      deliveryDamages: true,
      driverSignature: true,
      deliverySignature: true,
      brokerId: true,
      carrierId: true,
      driverId: true,
      createdAt: true,
      broker: { select: { id: true, companyName: true, fullName: true, companyAddress: true, companyCity: true, companyState: true, companyZip: true, phone: true, mcNumber: true, usdotNumber: true } },
      carrier: { select: { id: true, companyName: true, fullName: true, companyAddress: true, companyCity: true, companyState: true, companyZip: true, phone: true, mcNumber: true, usdotNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: skip,
    take: PAGE_SIZE,
  });

  const totalLoadsCount = await prisma.load.count({
    where: baseWhere,
  });
  
  const totalPages = Math.ceil(totalLoadsCount / PAGE_SIZE);

  const myRequests = isBroker ? [] : await prisma.loadRequest.findMany({
    where: { carrierId: userId, status: 'PENDING' },
    include: { load: { include: { broker: { select: { companyName: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const statusCounts = await prisma.load.groupBy({
    by: ['status'],
    where: baseWhere,
    _count: { id: true }
  });

  const counts = {
    offered: statusCounts.find(s => s.status === 'OFFERED')?._count.id || 0,
    booked: statusCounts.find(s => s.status === 'BOOKED')?._count.id || 0,
    inTransit: statusCounts.find(s => s.status === 'IN_TRANSIT')?._count.id || 0,
    delivered: statusCounts.find(s => s.status === 'DELIVERED')?._count.id || 0,
    requests: myRequests.length,
    total: totalLoadsCount
  };

  // Fetch partner companies for the filter
  let partnerCompanies: { id: string, companyName: string | null }[] = [];
  if (isBroker) {
    partnerCompanies = await prisma.user.findMany({
      where: { role: 'CARRIER', loadsAssigned: { some: { brokerId: userId } } },
      select: { id: true, companyName: true }
    });
  } else {
    partnerCompanies = await prisma.user.findMany({
      where: { role: 'BROKER', loadsPosted: { some: { carrierId: userId } } },
      select: { id: true, companyName: true }
    });
  }

  // Fetch metric for selected company
  let selectedCompanyDeliveredCount = 0;
  let selectedCompanyName = '';
  if (filterCompanyId) {
    const selectedCompany = partnerCompanies.find(c => c.id === filterCompanyId);
    if (selectedCompany) {
      selectedCompanyName = selectedCompany.companyName || 'Unknown Company';
      selectedCompanyDeliveredCount = await prisma.load.count({
        where: {
          ...(isBroker ? { brokerId: userId, carrierId: filterCompanyId } : { carrierId: userId, brokerId: filterCompanyId }),
          status: 'DELIVERED'
        }
      });
    }
  }

  async function handleAcceptOffer(formData: FormData) {
    'use server';
    const { userId: actionUserId, role } = await getSession();
    if (!actionUserId || role !== 'CARRIER') throw new Error('Forbidden');

    const loadIdRaw = formData.get('loadId');
    const parsed = z.string().uuid().safeParse(loadIdRaw);
    if (!parsed.success) throw new Error('Invalid load ID');
    const loadId = parsed.data;

    const load = await prisma.load.findUnique({ where: { id: loadId } });
    // Only allow accepting offers that are still in OFFERED status
    await prisma.load.updateMany({ where: { id: loadId, carrierId: actionUserId, status: 'OFFERED' }, data: { status: 'BOOKED' } });
    if (load) {
      await createNotification(load.brokerId, 'Offer Accepted', `Carrier accepted your offer for load #${loadId.substring(0,6).toUpperCase()}`, `/load/${loadId}`);
    }
    revalidatePath('/my-loads');
  }

  async function handleAssignDriver(formData: FormData) {
    'use server';
    const { userId: actionUserId, role } = await getSession();
    if (!actionUserId || role !== 'CARRIER') throw new Error('Forbidden');

    const loadIdRaw = formData.get('loadId');
    const driverIdRaw = formData.get('driverId');

    const parsedLoad = z.string().uuid().safeParse(loadIdRaw);
    const parsedDriver = z.string().uuid().safeParse(driverIdRaw);

    if (!parsedLoad.success || !parsedDriver.success) return;
    const loadId = parsedLoad.data;
    const driverId = parsedDriver.data;
    await prisma.load.updateMany({ where: { id: loadId, carrierId: actionUserId }, data: { driverId } });
    await createNotification(driverId, 'New Route Assigned', `You have been assigned a new route for load #${loadId.substring(0,6).toUpperCase()}`, `/driver`);
    revalidatePath('/my-loads');
  }

  async function handleRejectOffer(formData: FormData) {
    'use server';
    const { userId: actionUserId, role } = await getSession();
    if (!actionUserId || role !== 'CARRIER') throw new Error('Forbidden');

    const loadIdRaw = formData.get('loadId');
    const parsed = z.string().uuid().safeParse(loadIdRaw);
    if (!parsed.success) throw new Error('Invalid load ID');
    const loadId = parsed.data;

    await prisma.load.updateMany({ where: { id: loadId, carrierId: actionUserId }, data: { status: 'AVAILABLE', carrierId: null } });
    revalidatePath('/my-loads');
  }

  async function handleCancelRequest(formData: FormData) {
    'use server';
    const { userId: actionUserId } = await getSession();
    if (!actionUserId) throw new Error('Unauthorized');

    const requestIdRaw = formData.get('requestId');
    const parsed = z.string().uuid().safeParse(requestIdRaw);
    if (!parsed.success) throw new Error('Invalid request ID');
    const requestId = parsed.data;

    await prisma.loadRequest.deleteMany({ where: { id: requestId, carrierId: actionUserId } });
    revalidatePath('/my-loads');
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  }

  function getScheduledDate(date: Date, days: number) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return formatDate(newDate);
  }

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 pb-10">
      <AutoRefresh intervalMs={30000} />
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">My Dispatches</h1>
          <p className="text-gray-500 mt-2 text-lg">Manage your active and completed operations.</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* SIDEBAR DE STATUS */}
        <aside className="w-full lg:w-72 shrink-0 space-y-6">
          <div className="glass-panel border border-gray-100 rounded-2xl overflow-hidden shadow-xl bg-white">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Dispatch Status</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">My Requests</span>
                <span className="text-xs font-bold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-md border border-brand-500/20">{counts.requests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Pending Offers</span>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">{counts.offered}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Booked / Sched.</span>
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">{counts.booked}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Picked Up (Transit)</span>
                <span className="text-xs font-bold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-md border border-brand-500/20">{counts.inTransit}</span>
              </div>
              <div className="flex items-center justify-between opacity-60">
                <span className="text-sm font-medium text-gray-500">Delivered</span>
                <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">{counts.delivered}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* LISTA DE CARGAS */}
        <div className="flex-1 space-y-6">
          <FilterBar 
            companies={partnerCompanies} 
            currentCompanyId={filterCompanyId} 
            currentStatus={filterStatus} 
            isBroker={isBroker} 
          />

          {filterCompanyId && selectedCompanyName && (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-xl p-4 flex items-center gap-4">
              <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-black text-xl shrink-0">
                {selectedCompanyDeliveredCount}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 tracking-tight">Vehicles Delivered</h3>
                <p className="text-sm text-gray-600"><strong>{selectedCompanyName}</strong> has successfully completed {selectedCompanyDeliveredCount} deliveries for you so far.</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center bg-gray-50 px-5 py-3 rounded-xl border border-gray-100 mt-2">
            <div className="text-sm font-medium text-gray-500">
              Showing <span className="font-bold text-gray-900">{counts.total} Dispatches</span>
            </div>
          </div>

          {myRequests.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2 border-b border-gray-100 pb-2">My Pending Requests</h2>
              <div className="space-y-4">
                {myRequests.map(req => (
                  <div key={req.id} className="glass-panel border border-gray-100 border-l-4 border-l-brand-400 rounded-xl p-5 hover:border-gray-200 transition-all bg-white">
                    <div className="flex flex-wrap gap-4 justify-between items-center border-b border-gray-100 pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-lg text-brand-400 tracking-tight">#{req.load.id.substring(0, 8).toUpperCase()}</span>
                        <span className="bg-brand-500/10 text-brand-400 border border-brand-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Awaiting Broker</span>
                        {req.bidPrice && <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-[10px] font-bold">My Bid: ${req.bidPrice}</span>}
                      </div>
                      <form action={handleCancelRequest}>
                        <input type="hidden" name="requestId" value={req.id} />
                        <button type="submit" className="text-[10px] text-red-400 border border-red-400/30 hover:bg-red-500/10 font-bold px-4 py-2 rounded-lg transition-colors uppercase">
                          Cancel Request
                        </button>
                      </form>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Origin</div>
                        <div className="font-bold text-gray-900">{req.load.originCity} <span className="text-gray-500 font-normal">{req.load.originZip}</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Destination</div>
                        <div className="font-bold text-gray-900">{req.load.destCity} <span className="text-gray-500 font-normal">{req.load.destZip}</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Broker</div>
                        <div className="font-bold text-brand-400">{req.load.broker.companyName || 'Broker'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Load Price</div>
                        <div className="font-bold text-gray-900">${req.load.price.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {myLoads.length === 0 ? (
            <div className="p-16 text-center glass-panel border border-gray-100 rounded-2xl text-gray-500">
              Your dispatch board is currently empty.
            </div>
          ) : (
            myLoads.map(load => {
              let statusBorder = "border-l-zinc-500";
              let badgeStyle = "bg-zinc-500/10 text-gray-500 border-zinc-500/20";
              let displayStatus: string = load.status;
              let dateLabel = "Sched Pick Up";
              let dateValue = getScheduledDate(load.createdAt, 2);

              if (load.status === 'OFFERED') {
                statusBorder = "border-l-amber-500";
                badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                displayStatus = "Pending Signature";
              } else if (load.status === 'BOOKED') {
                statusBorder = "border-l-blue-500";
                badgeStyle = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                displayStatus = "Dispatched";
              } else if (load.status === 'IN_TRANSIT') {
                statusBorder = "border-l-brand-500";
                badgeStyle = "bg-brand-500/10 text-brand-400 border-brand-500/20";
                displayStatus = "In Transit";
                dateLabel = "Est. Delivery";
                dateValue = getScheduledDate(load.createdAt, 5);
              } else if (load.status === 'DELIVERED') {
                statusBorder = "border-l-green-500";
                badgeStyle = "bg-green-500/10 text-green-400 border-green-500/20";
                displayStatus = "Delivered";
                dateLabel = "Delivered On";
                dateValue = getScheduledDate(load.createdAt, 4);
              }

              return (
                <div key={load.id} className={`glass-panel border border-gray-100 border-l-4 rounded-xl p-6 transition-all hover:border-gray-200 bg-white ${statusBorder}`}>
                  
                  {/* Header do Card */}
                  <div className="flex flex-wrap gap-4 justify-between items-center border-b border-gray-100 pb-4 mb-5">
                    <div className="flex items-center gap-4">
                      <span className="font-black text-xl text-gray-900 tracking-tight">#{load.id.substring(0, 8).toUpperCase()}</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeStyle}`}>
                        {displayStatus}
                      </span>
                      <span className="text-xs text-gray-500 font-medium ml-2">
                        {dateLabel} <span className="font-bold text-gray-900 ml-1">{dateValue}</span>
                      </span>
                    </div>
                  </div>

                  {/* Grid de Dados */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Dispatch Info</div>
                      <div className="text-xs text-gray-500 mb-4">
                        Offered Date<br/>
                        <span className="text-gray-900 font-medium">{formatDate(load.createdAt)}</span>
                      </div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        {isBroker ? 'Carrier Info' : 'Broker Info'}
                      </div>
                      <a 
                        href={`/profile/${isBroker ? (load.carrier?.id || '') : load.broker.id}`} 
                        className={`text-sm font-bold text-brand-400 hover:underline ${isBroker && !load.carrier ? 'pointer-events-none opacity-50' : ''}`}
                      >
                        {isBroker ? (load.carrier?.companyName || 'Pending Assignment') : (load.broker.companyName || 'Independent Broker')}
                      </a>
                      <div className="text-xs text-gray-500">
                        {isBroker ? (load.carrier?.fullName || '') : (load.broker.fullName || 'Broker Agent')}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Load Info</div>
                      <div className="text-xl font-black text-gray-900">${load.price.toFixed(2)} <span className="text-[10px] font-normal text-gray-500 uppercase">| {load.paymentType}</span></div>
                      
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-5 mb-1">Vehicle Info</div>
                      <div className="text-sm font-bold text-gray-900">
                        {(() => {
                          const vehicles = Array.isArray(load.vehiclesData) ? load.vehiclesData : JSON.parse(load.vehiclesData as string || '[]');
                          if (vehicles.length === 0) return '1x Standard Vehicle';
                          if (vehicles.length === 1) return vehicles[0].model || vehicles[0].type || '1x Vehicle';
                          return `${vehicles.length}x Vehicles (${vehicles[0].model || vehicles[0].type} +${vehicles.length - 1})`;
                        })()}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Origin</div>
                      <div className="text-sm font-bold text-gray-900">Pickup Facility</div>
                      <div className="text-sm text-brand-400 font-medium">{load.originCity}, {load.originZip}</div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Destination</div>
                      <div className="text-sm font-bold text-gray-900">Delivery Location</div>
                      <div className="text-sm text-brand-400 font-medium">{load.destCity}, {load.destZip}</div>
                      
                      {load.status === 'IN_TRANSIT' ? (
                        <a href={`/track/${load.id}`} className="mt-4 bg-brand-500/10 text-brand-400 border border-brand-500/30 font-bold px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-brand-500/20 transition-colors w-full">
                          <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></span>
                          Live Track Driver
                        </a>
                      ) : (
                        <a href={`/load/${load.id}`} className="inline-block mt-2 text-xs font-bold text-brand-500 hover:text-brand-400 transition-colors">
                          View Route ({load.distance} mi) &rarr;
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3 items-center">
                    
                    {load.status === 'OFFERED' && (
                      <>
                        <form action={handleRejectOffer}>
                          <input type="hidden" name="loadId" value={load.id} />
                          <button type="submit" className="bg-transparent hover:bg-gray-50 text-red-400 border border-red-400/30 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors">
                            Decline
                          </button>
                        </form>
                        <form action={handleAcceptOffer}>
                          <input type="hidden" name="loadId" value={load.id} />
                          <button type="submit" className="bg-brand-500 hover:bg-brand-400 text-gray-900 font-bold px-8 py-2.5 rounded-xl text-xs transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                            Sign & Accept
                          </button>
                        </form>
                      </>
                    )}

                    {load.status === 'BOOKED' && (
                      <>
                        {!load.driverId ? (
                          !isBroker ? (
                            <div className="flex items-center gap-4 w-full justify-end">
                              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                                Action Required: Assign Driver
                              </div>
                              <form action={handleAssignDriver} className="flex items-center gap-2">
                                <input type="hidden" name="loadId" value={load.id} />
                                <select name="driverId" required className="bg-black/50 border border-gray-100 text-gray-900 text-xs rounded-lg p-2.5 focus:outline-none focus:border-brand-500">
                                  <option value="">Select a driver...</option>
                                  {currentUser.fleetDrivers?.map((d: any) => (
                                    <option key={d.id} value={d.id}>{d.fullName}</option>
                                  ))}
                                </select>
                                <button type="submit" className="bg-brand-500 hover:bg-brand-400 text-gray-900 font-bold px-6 py-2.5 rounded-lg text-xs transition-colors">
                                  Dispatch
                                </button>
                              </form>
                            </div>
                          ) : (
                            <div className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mr-auto bg-amber-500/10 px-3 py-1.5 rounded-md border border-amber-500/20">
                              Awaiting Carrier to Assign Driver
                            </div>
                          )
                        ) : (
                          <>
                            <div className="text-[10px] text-green-400 font-bold uppercase tracking-wider mr-auto">✓ Dispatched</div>
                            {/* DownloadContractButton remains unchanged or needs styling */}
                            <DownloadContractButton load={load} currentUser={currentUser} />
                          </>
                        )}
                      </>
                    )}

                    {load.status === 'IN_TRANSIT' && (
                      <>
                        <DownloadContractButton load={load} currentUser={currentUser} />
                      </>
                    )}

                    {load.status === 'DELIVERED' && (
                      <>
                        <div className="mr-auto text-gray-500 text-xs flex gap-2">
                          <GenerateInvoiceButton 
                            invoiceData={{
                              loadId: load.id, 
                              date: new Date().toLocaleDateString(), 
                              origin: load.originCity, 
                              destination: load.destCity, 
                              price: load.price, 
                              vin: load.deliveryVin || 'Unknown', 
                              brokerCompany: load.broker.companyName || 'Unknown Broker', 
                              brokerAddress: load.broker.companyAddress || undefined,
                              brokerCity: load.broker.companyCity || undefined,
                              brokerState: load.broker.companyState || undefined,
                              brokerZip: load.broker.companyZip || undefined,
                              carrierCompany: load.carrier?.companyName || 'Unknown Carrier',
                              carrierAddress: load.carrier?.companyAddress || undefined,
                              carrierCity: load.carrier?.companyCity || undefined,
                              carrierState: load.carrier?.companyState || undefined,
                              carrierZip: load.carrier?.companyZip || undefined,
                              carrierPhone: load.carrier?.phone || undefined,
                            }} 
                          />
                        </div>
                        <DownloadBOLButton load={{ ...load as any, brokerCompany: load.broker.companyName || 'Unknown', brokerMc: load.broker.mcNumber, brokerUsdot: load.broker.usdotNumber, carrierCompany: load.carrier?.companyName || 'Unknown', carrierMc: load.carrier?.mcNumber, carrierUsdot: load.carrier?.usdotNumber }} />
                        <DownloadContractButton load={load} currentUser={currentUser} />
                        <a href={`/load/${load.id}`} className="bg-brand-600 hover:bg-brand-500 text-gray-900 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)] whitespace-nowrap">
                           View Photos
                        </a>
                        <a href={`/review/${load.id}`} className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)] whitespace-nowrap">
                           Rate Partner
                        </a>
                      </>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <Link 
              href={`/my-loads?page=${currentPage - 1}`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${currentPage <= 1 ? 'opacity-50 pointer-events-none bg-zinc-100 text-gray-500 ' : 'bg-brand-500 hover:bg-brand-600 text-gray-900 shadow-md'}`}
            >
              Previous
            </Link>
            
            <span className="text-sm font-medium text-zinc-600 ">
              Page {currentPage} of {totalPages}
            </span>
            
            <Link 
              href={`/my-loads?page=${currentPage + 1}`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${currentPage >= totalPages ? 'opacity-50 pointer-events-none bg-zinc-100 text-gray-500 ' : 'bg-brand-500 hover:bg-brand-600 text-gray-900 shadow-md'}`}
            >
              Next
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

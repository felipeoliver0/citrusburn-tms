import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import LoadboardClient from './LoadboardClient';
import AutoRefresh from '@/app/components/AutoRefresh';
import SubscriptionRequired from './SubscriptionRequired';
import { unstable_cache } from 'next/cache';
import { hasActiveSubscription, isSubscriptionRequired } from '@/lib/subscription';

export default async function Loadboard({ searchParams }: { searchParams: Promise<{ origin?: string, dest?: string, originState?: string, destState?: string, maxMiles?: string, page?: string, trailerType?: string, paymentType?: string }> }) {
  const { userId } = await verifySession();

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      companyName: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      subscriptionEndsAt: true,
    },
  });
  if (!currentUser) redirect('/login');

  if (currentUser.role === 'DRIVER') {
    redirect('/driver');
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

  const resolvedParams = await searchParams;
  const originQuery = resolvedParams?.origin || '';
  const destQuery = resolvedParams?.dest || '';
  const originStateQuery = resolvedParams?.originState || '';
  const destStateQuery = resolvedParams?.destState || '';
  const trailerTypeQuery = resolvedParams?.trailerType || '';
  const paymentTypeQuery = resolvedParams?.paymentType || '';
  const maxMilesQuery = resolvedParams?.maxMiles ? parseFloat(resolvedParams.maxMiles) : null;
  const page = resolvedParams?.page ? parseInt(resolvedParams.page) : 1;
  const PAGE_SIZE = 20;

  const andConditions: any[] = [];
  if (maxMilesQuery && maxMilesQuery > 0) andConditions.push({ distance: { lte: maxMilesQuery } });
  if (trailerTypeQuery) andConditions.push({ trailerType: trailerTypeQuery });
  if (paymentTypeQuery) andConditions.push({ paymentType: paymentTypeQuery });

  if (originQuery) {
    const isState = originQuery.length === 2 && /^[A-Za-z]{2}$/.test(originQuery);
    andConditions.push({
      OR: [
        { originCity: { startsWith: originQuery, mode: 'insensitive' } },
        ...(isState 
          ? [{ originCity: { endsWith: `, ${originQuery.toUpperCase()}` } }] 
          : [{ originCity: { contains: originQuery, mode: 'insensitive' } }]),
        { originZip: { contains: originQuery, mode: 'insensitive' } }
      ]
    });
  }
  
  if (originStateQuery) {
    andConditions.push({
      OR: [
        { originCity: { endsWith: `, ${originStateQuery}`, mode: 'insensitive' } },
        { originZip: { startsWith: originStateQuery } }
      ]
    });
  }

  if (destQuery) {
    const isState = destQuery.length === 2 && /^[A-Za-z]{2}$/.test(destQuery);
    andConditions.push({
      OR: [
        { destCity: { startsWith: destQuery, mode: 'insensitive' } },
        ...(isState 
          ? [{ destCity: { endsWith: `, ${destQuery.toUpperCase()}` } }] 
          : [{ destCity: { contains: destQuery, mode: 'insensitive' } }]),
        { destZip: { contains: destQuery, mode: 'insensitive' } }
      ]
    });
  }

  if (destStateQuery) {
    andConditions.push({
      OR: [
        { destCity: { endsWith: `, ${destStateQuery}`, mode: 'insensitive' } },
        { destZip: { startsWith: destStateQuery } }
      ]
    });
  }


  // Define a cached function that uniquely identifies the query combination
  const getCachedLoads = unstable_cache(
    async (conditions, uid, pageNum, pageSize) => {
      const count = await prisma.load.count({
        where: { status: 'AVAILABLE', ...(conditions.length > 0 ? { AND: conditions } : {}) }
      });

      const loads = await prisma.load.findMany({
        where: { status: 'AVAILABLE', ...(conditions.length > 0 ? { AND: conditions } : {}) },
        select: {
          id: true,
          originCity: true,
          originZip: true,
          destCity: true,
          destZip: true,
          price: true,
          distance: true,
          status: true,
          trailerType: true,
          paymentType: true,
          pickupDate: true,
          deliveryDate: true,
          createdAt: true,
          vehiclesData: true,
          requests: {
            where: { carrierId: uid },
            select: { id: true, status: true, carrierId: true, bidPrice: true }
          },
          broker: { select: { id: true, companyName: true, fullName: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (pageNum - 1) * pageSize,
      });

      return { count, loads };
    },
    ['loadboard-query', userId, originQuery, destQuery, originStateQuery, destStateQuery, maxMilesQuery ? String(maxMilesQuery) : 'none', String(page), trailerTypeQuery, paymentTypeQuery],
    { revalidate: 15, tags: ['loadboard'] } // Cache valid for 15s to absorb AutoRefresh hits
  );

  const { count: totalLoadsCount, loads: availableLoads } = await getCachedLoads(andConditions, userId, page, PAGE_SIZE);

  const totalPages = Math.ceil(totalLoadsCount / PAGE_SIZE);

  const savedSearches = await prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <AutoRefresh intervalMs={30000} />
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Loadboard</h1>
          <p className="text-gray-500 mt-2 text-lg">Find the best routes and maximize your earnings.</p>
        </div>
      </header>
      
      <LoadboardClient 
        availableLoads={availableLoads} 
        savedSearches={savedSearches} 
        currentUser={currentUser} 
        page={page}
        totalPages={totalPages}
        totalCount={totalLoadsCount}
      />
    </div>
  );
}

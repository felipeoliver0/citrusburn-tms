import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/dal';
import { isRateLimited } from '@/lib/rateLimit';

export async function GET(req: Request) {
  // Auth check - this endpoint was previously open to anyone
  const { userId, role } = await getSession();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (await isRateLimited(`load-details:${userId}`, 60)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const loadId = searchParams.get('loadId');

  if (!loadId) return NextResponse.json({ error: 'Missing loadId' }, { status: 400 });

  const load = await prisma.load.findUnique({
    where: { id: loadId },
    select: {
      id: true,
      originZip: true,
      originCity: true,
      originAddress: true,
      destZip: true,
      destCity: true,
      destAddress: true,
      price: true,
      distance: true,
      status: true,
      pickupDate: true,
      deliveryDate: true,
      vehiclesData: true,
      trailerType: true,
      paymentType: true,
      currentLat: true,
      currentLng: true,
      driverSignature: true,
      pickupPhotos: true,
      pickupDamages: true,
      pickupVin: true,
      pickupVinPhoto: true,
      podDocumentUrl: true,
      deliverySignature: true,
      deliveryPhotos: true,
      deliveryDamages: true,
      deliveryVin: true,
      deliveryVinPhoto: true,
      brokerId: true,
      carrierId: true,
      driverId: true,
      createdAt: true,
    },
  });

  if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 });

  // Authorization: only broker, carrier, or driver of this load can see its details
  const isAuthorized =
    role === 'ADMIN' ||
    load.brokerId === userId ||
    load.carrierId === userId ||
    load.driverId === userId;

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(load);
}

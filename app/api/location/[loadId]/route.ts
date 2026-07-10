import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/dal';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ loadId: string }> }
) {
  try {
    // Auth check - this endpoint was previously open to anyone
    const { userId } = await getSession();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const loadId = resolvedParams.loadId;

    if (!loadId) {
      return NextResponse.json({ error: 'Missing load ID' }, { status: 400 });
    }

    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: {
        currentLat: true,
        currentLng: true,
        status: true,
        brokerId: true,
        carrierId: true,
        driverId: true,
        locationHistory: { orderBy: { timestamp: 'asc' } },
      },
    });

    if (!load) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 });
    }

    // Authorization: only broker, carrier, or driver of this load can see tracking data
    const isAuthorized =
      load.brokerId === userId ||
      load.carrierId === userId ||
      load.driverId === userId;

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      lat: load.currentLat,
      lng: load.currentLng,
      status: load.status,
      history: load.locationHistory || [],
    });
  } catch (error) {
    console.error('Error fetching GPS data:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

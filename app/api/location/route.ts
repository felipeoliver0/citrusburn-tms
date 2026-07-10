import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/dal';
import { LocationUpdateSchema } from '@/lib/validations';
import { isRateLimited } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    const { userId } = await getSession();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 30 location updates per minute per user
    if (await isRateLimited(`location:${userId}`, 30)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();

    // Validate input with Zod
    const parsed = LocationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { loadId, lat, lng } = parsed.data;

    const load = await prisma.load.findUnique({ where: { id: loadId } });
    if (!load) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (load.carrierId !== userId && load.driverId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!['BOOKED', 'IN_TRANSIT'].includes(load.status)) {
      return NextResponse.json({ error: 'Load is not active' }, { status: 400 });
    }

    await prisma.load.update({
      where: { id: loadId },
      data: { currentLat: lat, currentLng: lng }
    });

    return NextResponse.json({ success: true, message: 'GPS updated' });
  } catch (error) {
    console.error('GPS update error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

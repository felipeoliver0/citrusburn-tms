import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/dal';
import { TrackingSchema } from '@/lib/validations';
import { isRateLimited } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    const { userId, role } = await getSession();

    if (!userId || role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized or invalid role' }, { status: 403 });
    }

    // Rate limit: 30 GPS updates per minute per user
    if (await isRateLimited(`tracking:${userId}`, 30)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();

    // Validate input with Zod
    const parsed = TrackingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid coordinates', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { loadId, lat, lng } = parsed.data;

    // Find the specific active load for this driver
    const load = await prisma.load.findUnique({
      where: {
        id: loadId,
      },
      select: {
        driverId: true,
        currentLat: true,
        currentLng: true,
        status: true,
      },
    });

    if (!load || load.driverId !== userId) {
      return NextResponse.json({ error: 'Load not found or unauthorized' }, { status: 403 });
    }

    if (load.status !== 'IN_TRANSIT') {
      return NextResponse.json({ success: true, message: 'Load is not in transit' });
    }

    // Use a transaction to batch all DB operations
    await prisma.$transaction(async (tx) => {
      // Only log history if coordinates changed significantly (~50m)
      const hasMovedSignificantly =
        !load.currentLat || !load.currentLng ||
        Math.abs(load.currentLat - lat) > 0.0005 ||
        Math.abs(load.currentLng - lng) > 0.0005;

      if (hasMovedSignificantly) {
        await tx.locationHistory.create({
          data: { loadId, lat, lng },
        });
      }

      await tx.load.update({
        where: { id: loadId },
        data: { currentLat: lat, currentLng: lng },
      });
    });

    return NextResponse.json({ success: true, updatedLoads: 1 });
  } catch (error) {
    console.error('GPS Update Error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Failed to update GPS' }, { status: 500 });
  }
}

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

    const { lat, lng } = parsed.data;

    // Find all active loads for this driver
    const activeLoads = await prisma.load.findMany({
      where: {
        driverId: userId,
        status: 'IN_TRANSIT',
      },
      select: {
        id: true,
        currentLat: true,
        currentLng: true,
        status: true,
      },
    });

    if (activeLoads.length === 0) {
      return NextResponse.json({ success: true, message: 'No active loads to track' });
    }

    // Use a transaction to batch all DB operations
    await prisma.$transaction(async (tx) => {
      for (const load of activeLoads) {
        // Only log history if coordinates changed significantly (~50m)
        const hasMovedSignificantly =
          !load.currentLat || !load.currentLng ||
          Math.abs(load.currentLat - lat) > 0.0005 ||
          Math.abs(load.currentLng - lng) > 0.0005;

        if (hasMovedSignificantly) {
          await tx.locationHistory.create({
            data: { loadId: load.id, lat, lng },
          });
        }

        await tx.load.update({
          where: { id: load.id },
          data: { currentLat: lat, currentLng: lng },
        });
      }
    });

    return NextResponse.json({ success: true, updatedLoads: activeLoads.length });
  } catch (error) {
    console.error('GPS Update Error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Failed to update GPS' }, { status: 500 });
  }
}

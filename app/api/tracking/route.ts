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

    // Fetch driver profile to verify carrier affiliation (Fleet)
    const driver = await prisma.user.findUnique({
      where: { id: userId },
      select: { employerId: true, role: true, deletedAt: true },
    });

    if (!driver || driver.role !== 'DRIVER' || driver.deletedAt) {
      return NextResponse.json({ error: 'Driver profile not found or inactive' }, { status: 403 });
    }

    if (!driver.employerId) {
      return NextResponse.json({ error: 'Driver is not affiliated with any carrier' }, { status: 403 });
    }

    // Find the specific active load and validate chain of custody
    const load = await prisma.load.findUnique({
      where: {
        id: loadId,
      },
      select: {
        id: true,
        driverId: true,
        carrierId: true,
        currentLat: true,
        currentLng: true,
        status: true,
      },
    });

    if (!load) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 });
    }

    // Chain validation:
    // 1. Driver assigned to this specific load
    if (load.driverId !== userId) {
      return NextResponse.json({ error: 'Driver is not assigned to this load' }, { status: 403 });
    }

    // 2. Driver's employer must match the load's assigned carrier
    if (load.carrierId !== driver.employerId) {
      return NextResponse.json(
        { error: 'Chain of custody violation: Driver employer does not match load carrier' },
        { status: 403 }
      );
    }

    // 3. Load must be in an active tracking state (BOOKED or IN_TRANSIT)
    if (load.status !== 'BOOKED' && load.status !== 'IN_TRANSIT') {
      return NextResponse.json(
        { error: `Load is not in an active tracking state (${load.status})` },
        { status: 400 }
      );
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

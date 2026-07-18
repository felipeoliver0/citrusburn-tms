import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/dal';
import { UpdateLoadSchema } from '@/lib/validations';
import { isRateLimited } from '@/lib/rateLimit';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const { userId, role } = await getSession();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (await isRateLimited(`load-update:${userId}`, 20)) {
      return NextResponse.json({ error: 'Too many updates recently. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();

    // Validate input with Zod
    const parsed = UpdateLoadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { loadId, originCity, originZip, destCity, destZip, price, distance, trailerType, paymentType, vehiclesList } = parsed.data;

    let whereClause: any = { id: loadId };
    
    // Only Broker who created the load, or Admin, can update core load details like price/route.
    if (role !== 'ADMIN') {
      whereClause.brokerId = userId;
    }

    const result = await prisma.load.updateMany({
      where: whereClause,
      data: {
        originCity,
        originZip,
        destCity,
        destZip,
        price,
        distance,
        trailerType,
        paymentType,
        vehiclesData: vehiclesList as any,
      }
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Audit log
    await logAudit(userId, 'LOAD_UPDATED', 'Load', loadId, { price, distance, originCity, destCity });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating load:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Failed to update load' }, { status: 500 });
  }
}

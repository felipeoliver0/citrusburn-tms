import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/dal';
import { CreateLoadSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { isRateLimited } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    const { userId, role } = await getSession();

    if (!userId || !role || !['BROKER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to create loads' }, { status: 403 });
    }

    if (await isRateLimited(`load-create:${userId}`, 10)) {
      return NextResponse.json({ error: 'Too many loads created recently. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscriptionStatus: true } });
    if (!user || ['CANCELED', 'PAST_DUE', 'NONE'].includes(user.subscriptionStatus)) {
      return NextResponse.json({ error: 'Payment required: Active subscription is needed to post loads.' }, { status: 402 });
    }

    // Validate input with Zod
    const parsed = CreateLoadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      originAddress,
      originCity,
      originZip,
      destAddress,
      destCity,
      destZip,
      pickupDate,
      deliveryDate,
      price,
      vehiclesList,
      distance,
      trailerType,
      paymentType,
    } = parsed.data;

    const newLoad = await prisma.load.create({
      data: {
        brokerId: userId,
        status: 'AVAILABLE',
        originAddress,
        originCity,
        originZip,
        destAddress,
        destCity,
        destZip,
        pickupDate: new Date(pickupDate),
        deliveryDate: new Date(deliveryDate),
        price,
        distance,
        vehiclesData: vehiclesList,
        trailerType,
        paymentType,
      }
    });

    revalidatePath('/loadboard');

    return NextResponse.json({ success: true, loadId: newLoad.id });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

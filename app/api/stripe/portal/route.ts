import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import { getStripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    const { userId, role } = await verifySession();
    if (role !== 'CARRIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating stripe portal session:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/dal';
import { getStripe, getStripePriceId } from '@/lib/stripe';

export async function POST() {
  const { userId, role } = await getSession();

  if (!userId || role !== 'CARRIER') {
    return NextResponse.json({ error: 'Only carriers can subscribe' }, { status: 403 });
  }

  const stripe = getStripe();
  const priceId = getStripePriceId();

  if (!stripe || !priceId) {
    return NextResponse.json(
      { error: 'Billing is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID.' },
      { status: 503 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, stripeCustomerId: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings?billing=success`,
    cancel_url: `${appUrl}/settings?billing=canceled`,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
  });

  return NextResponse.json({ url: session.url });
}

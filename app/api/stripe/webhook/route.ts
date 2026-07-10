import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe';

export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = getStripeWebhookSecret();

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: 'ACTIVE',
            stripeSubscriptionId: String(session.subscription),
          },
        });
      }
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        const statusMap: Record<string, 'ACTIVE' | 'PAST_DUE' | 'CANCELED'> = {
          active: 'ACTIVE',
          past_due: 'PAST_DUE',
          canceled: 'CANCELED',
          unpaid: 'PAST_DUE',
        };
        const mapped = statusMap[subscription.status] ?? 'ACTIVE';
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: mapped,
            subscriptionEndsAt: subscription.cancel_at
              ? new Date(subscription.cancel_at * 1000)
              : null,
          },
        });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionStatus: 'CANCELED' },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

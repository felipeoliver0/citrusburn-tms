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

  // P1-14: StripeEvent Idempotency
  try {
    await prisma.stripeEvent.create({
      data: {
        id: event.id,
        type: event.type
      }
    });
  } catch (e: any) {
    if (e.code === 'P2002') {
      console.log(`[Stripe Webhook] Duplicate event ignored: ${event.id}`);
      return NextResponse.json({ received: true });
    }
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        // P1-15: validate customer id if present
        const whereClause: any = { id: userId };
        if (session.customer) {
          whereClause.stripeCustomerId = String(session.customer);
        }
        
        try {
          await prisma.user.update({
            where: whereClause,
            data: {
              subscriptionStatus: 'ACTIVE',
              stripeSubscriptionId: String(session.subscription),
              stripeCustomerId: String(session.customer),
            },
          });
        } catch (error) {
          console.error(`[Stripe Webhook] User update failed for session ${session.id}:`, error);
        }
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
        
        try {
          await prisma.user.update({
            where: { id: userId, stripeCustomerId: String(subscription.customer) },
            data: {
              subscriptionStatus: mapped,
              subscriptionEndsAt: subscription.cancel_at
                ? new Date(subscription.cancel_at * 1000)
                : null,
            },
          });
        } catch (error) {
          console.error(`[Stripe Webhook] User update failed for sub updated ${subscription.id}:`, error);
        }
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        try {
          await prisma.user.update({
            where: { id: userId, stripeCustomerId: String(subscription.customer) },
            data: { subscriptionStatus: 'CANCELED' },
          });
        } catch (error) {
           console.error(`[Stripe Webhook] User update failed for sub deleted ${subscription.id}:`, error);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/stripe/webhook/route';

// Mock dependências
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      update: vi.fn()
    }
  }
}));

vi.mock('@/lib/stripe', () => {
  const constructEvent = vi.fn();
  return {
    getStripe: () => ({
      webhooks: {
        constructEvent
      }
    }),
    getStripeWebhookSecret: () => 'whsec_test123'
  };
});

import prisma from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRequest = () => {
    return new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'stripe-signature': 't=123,v1=test'
      },
      body: JSON.stringify({ id: 'evt_test' })
    });
  };

  it('should update user to ACTIVE on checkout.session.completed', async () => {
    const stripe = getStripe();
    (stripe!.webhooks.constructEvent as any).mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          subscription: 'sub_123',
          metadata: { userId: 'user-1' }
        }
      }
    });

    const req = mockRequest();
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.received).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        subscriptionStatus: 'ACTIVE',
        stripeSubscriptionId: 'sub_123'
      }
    });
  });

  it('should update user to CANCELED on customer.subscription.deleted', async () => {
    const stripe = getStripe();
    (stripe!.webhooks.constructEvent as any).mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          metadata: { userId: 'user-2' }
        }
      }
    });

    const req = mockRequest();
    const res = await POST(req);
    
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-2' },
      data: { subscriptionStatus: 'CANCELED' }
    });
  });
});

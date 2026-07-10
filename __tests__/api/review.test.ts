import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/review/route';

// Mock dependências
vi.mock('@/lib/prisma', () => ({
  default: {
    load: {
      findUnique: vi.fn()
    },
    review: {
      findUnique: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
    }
  }
}));

vi.mock('@/lib/dal', () => ({
  getSession: vi.fn()
}));

import { getSession } from '@/lib/dal';
import prisma from '@/lib/prisma';

describe('POST /api/review (TargetId Validation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRequest = (body: any) => {
    return new Request('http://localhost/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  };

  it('should return 400 if targetId is NOT the other party on the load', async () => {
    (getSession as any).mockResolvedValue({ userId: '11111111-1111-4111-a111-111111111111' });
    
    // Mock Load onde o Broker é broker-1 e Carrier é carrier-1
    (prisma.load.findUnique as any).mockResolvedValue({
      id: '22222222-2222-4222-a222-222222222222',
      status: 'DELIVERED',
      brokerId: '11111111-1111-4111-a111-111111111111',
      carrierId: '33333333-3333-4333-a333-333333333333'
    });

    // broker-1 tenta avaliar driver-aleatorio em vez de carrier-1
    const req = mockRequest({
      loadId: '22222222-2222-4222-a222-222222222222',
      targetId: '44444444-4444-4444-a444-444444444444',
      rating: 5,
      comment: 'Good'
    });

    const res = await POST(req);
    const data = await res.json();
    console.log(data);

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/Target must be the other party/i);
    expect(prisma.review.create).not.toHaveBeenCalled();
  });

  it('should return 200 OK if targetId is the Carrier and author is Broker', async () => {
    (getSession as any).mockResolvedValue({ userId: '11111111-1111-4111-a111-111111111111' });
    
    (prisma.load.findUnique as any).mockResolvedValue({
      id: '22222222-2222-4222-a222-222222222222',
      status: 'DELIVERED',
      brokerId: '11111111-1111-4111-a111-111111111111',
      carrierId: '33333333-3333-4333-a333-333333333333'
    });

    (prisma.review.findUnique as any).mockResolvedValue(null);

    // broker-1 avalia carrier-1
    const req = mockRequest({
      loadId: '22222222-2222-4222-a222-222222222222',
      targetId: '33333333-3333-4333-a333-333333333333',
      rating: 5,
      comment: 'Good'
    });

    const res = await POST(req);
    
    expect(res.status).toBe(200);
    expect(prisma.review.create).toHaveBeenCalledOnce();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/load/create/route';

// Mock dependências
vi.mock('@/lib/prisma', () => ({
  default: {
    load: {
      create: vi.fn().mockResolvedValue({ id: 'mock-load-123' })
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ subscriptionStatus: 'ACTIVE' })
    }
  }
}));

vi.mock('@/lib/dal', () => ({
  getSession: vi.fn()
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

// Precisamos importar o mock para manipulá-arlo no teste
import { getSession } from '@/lib/dal';
import prisma from '@/lib/prisma';

describe('POST /api/load/create (RBAC)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload = {
    originAddress: '123 Main St',
    originCity: 'Miami',
    originZip: '33101',
    destAddress: '456 Oak St',
    destCity: 'Orlando',
    destZip: '32801',
    pickupDate: '2026-07-01',
    deliveryDate: '2026-07-02',
    price: 500,
    distance: 200,
    trailerType: 'OPEN',
    paymentType: 'COD',
    vehiclesList: []
  };

  const mockRequest = (body: any) => {
    return new Request('http://localhost/api/load/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  };

  it('should return 403 Forbidden for CARRIER', async () => {
    (getSession as any).mockResolvedValue({ userId: 'user1', role: 'CARRIER' });

    const req = mockRequest(validPayload);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toMatch(/Forbidden/i);
    expect(prisma.load.create).not.toHaveBeenCalled();
  });

  it('should return 403 Forbidden for DRIVER', async () => {
    (getSession as any).mockResolvedValue({ userId: 'user2', role: 'DRIVER' });

    const req = mockRequest(validPayload);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toMatch(/Forbidden/i);
    expect(prisma.load.create).not.toHaveBeenCalled();
  });

  it('should return 403 Forbidden for Unauthenticated', async () => {
    (getSession as any).mockResolvedValue({ userId: null, role: null });

    const req = mockRequest(validPayload);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(prisma.load.create).not.toHaveBeenCalled();
  });

  it('should return 200 OK for BROKER', async () => {
    (getSession as any).mockResolvedValue({ userId: 'broker1', role: 'BROKER' });

    const req = mockRequest(validPayload);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.loadId).toBe('mock-load-123');
    expect(prisma.load.create).toHaveBeenCalledOnce();
  });

  it('should return 200 OK for ADMIN', async () => {
    (getSession as any).mockResolvedValue({ userId: 'admin1', role: 'ADMIN' });

    const req = mockRequest(validPayload);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.loadId).toBe('mock-load-123');
    expect(prisma.load.create).toHaveBeenCalledOnce();
  });
});

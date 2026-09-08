import prisma from '@/lib/prisma';
import { LoadStatus, Role, Prisma } from '@prisma/client';

export const VALID_TRANSITIONS: Record<LoadStatus, LoadStatus[]> = {
  AVAILABLE:  ['OFFERED', 'BOOKED'],
  OFFERED:    ['BOOKED', 'AVAILABLE'],
  BOOKED:     ['IN_TRANSIT', 'AVAILABLE'],
  IN_TRANSIT: ['DELIVERED'],
  DELIVERED:  ['INVOICED'],
  INVOICED:   [],
};

export const TRANSITION_PERMISSIONS: Record<LoadStatus, Partial<Record<LoadStatus, Role[]>>> = {
  AVAILABLE: {
    OFFERED: ['BROKER', 'ADMIN'],
    BOOKED: ['CARRIER', 'ADMIN'],
  },
  OFFERED: {
    AVAILABLE: ['CARRIER', 'BROKER', 'ADMIN'],
    BOOKED: ['CARRIER', 'ADMIN'],
  },
  BOOKED: {
    IN_TRANSIT: ['DRIVER', 'ADMIN'],
    AVAILABLE: ['CARRIER', 'ADMIN'],
  },
  IN_TRANSIT: {
    DELIVERED: ['DRIVER', 'ADMIN'],
  },
  DELIVERED: {
    INVOICED: ['BROKER', 'ADMIN'],
  },
  INVOICED: {},
};

export async function transitionLoad(
  loadId: string,
  newStatus: LoadStatus,
  actorId: string,
  actorRole: Role,
  additionalData: Prisma.LoadUncheckedUpdateInput = {},
  tx: Prisma.TransactionClient | typeof prisma = prisma
) {
  // Fetch current state
  const load = await tx.load.findUnique({
    where: { id: loadId },
    select: { 
      status: true,
      brokerId: true,
      carrierId: true,
      driverId: true
    }
  });

  if (!load) {
    throw new Error('Load not found');
  }

  // Authorize based on role
  if (actorRole !== 'ADMIN') {
    if (actorRole === 'BROKER' && load.brokerId !== actorId) {
      throw new Error('Forbidden: Broker does not own this load');
    }
    // Note: In some edge cases (like a carrier requesting a load), they won't be the carrierId yet. 
    // The calling code should ensure they have the right to claim the load, 
    // but we enforce they can't touch other carrier's loads once it's booked.
    if (actorRole === 'CARRIER' && load.carrierId && load.carrierId !== actorId) {
      throw new Error('Forbidden: Carrier does not own this load');
    }
    if (actorRole === 'DRIVER' && load.driverId !== actorId) {
      throw new Error('Forbidden: Driver is not assigned to this load');
    }
  }

  // Validate state machine transition exists
  if (!VALID_TRANSITIONS[load.status as LoadStatus]?.includes(newStatus)) {
    throw new Error(`Invalid transition: cannot move load from ${load.status} to ${newStatus}`);
  }

  // Validate state machine transition authorization
  const allowedRoles = TRANSITION_PERMISSIONS[load.status as LoadStatus]?.[newStatus] ?? [];
  if (!allowedRoles.includes(actorRole)) {
    throw new Error(`Forbidden: Role ${actorRole} cannot perform ${load.status} → ${newStatus}`);
  }

  // Perform atomic update
  const result = await tx.load.updateMany({
    where: { 
      id: loadId, 
      status: load.status // Enforce atomic state transition
    },
    data: {
      status: newStatus,
      ...additionalData
    }
  });

  if (result.count !== 1) {
    throw new Error('State transition failed due to a race condition or concurrent update.');
  }

  // P1-03: Add AuditLog
  await tx.auditLog.create({
    data: {
      userId: actorId,
      action: 'LOAD_STATUS_CHANGED',
      resourceType: 'Load',
      resourceId: loadId,
      details: {
        from: load.status,
        to: newStatus,
      }
    }
  });

  return true;
}

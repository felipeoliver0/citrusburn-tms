import prisma from '@/lib/prisma';
import { LoadStatus, Role, Prisma } from '@prisma/client';

export const VALID_TRANSITIONS: Record<LoadStatus, LoadStatus[]> = {
  AVAILABLE:  ['OFFERED', 'BOOKED'],
  OFFERED:    ['BOOKED', 'AVAILABLE'],
  BOOKED:     ['IN_TRANSIT', 'AVAILABLE'], // Added AVAILABLE in case of cancellation
  IN_TRANSIT: ['DELIVERED'],
  DELIVERED:  ['INVOICED'],
  INVOICED:   [],
};

export async function transitionLoad(
  loadId: string,
  newStatus: LoadStatus,
  actorId: string,
  actorRole: Role,
  additionalData: Prisma.LoadUncheckedUpdateInput = {},
  tx: any = prisma
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

  // Validate state machine transition
  if (!VALID_TRANSITIONS[load.status as LoadStatus]?.includes(newStatus)) {
    throw new Error(`Invalid transition: cannot move load from ${load.status} to ${newStatus}`);
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

  return true;
}

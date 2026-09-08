'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/dal';
import { z } from 'zod';
import { hasActiveSubscription } from '@/lib/subscription';

export async function requestLoadAction(loadId: string, bidPrice: number | null) {
  const { userId: actionUserId, role } = await getSession();

  if (!actionUserId || role !== 'CARRIER') {
    return { error: 'Forbidden: Only carriers can request loads' };
  }

  const parsedLoadId = z.string().uuid().safeParse(loadId);
  const parsedBid = z.union([z.number().min(0).max(1_000_000), z.null()]).safeParse(bidPrice);

  if (!parsedLoadId.success || !parsedBid.success) {
    return { error: 'Invalid input parameters' };
  }

  const user = await prisma.user.findUnique({
    where: { id: actionUserId },
    select: {
      role: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      subscriptionEndsAt: true,
    }
  });

  if (!user || !hasActiveSubscription(user)) {
    return {
      error: 'Payment required: Active subscription is needed to bid on loads.'
    };
  }

  const load = await prisma.load.findUnique({
    where: { id: loadId },
    select: {
      id: true,
      status: true,
      brokerId: true,
    },
  });

  if (!load) {
    return { error: 'Load not found' };
  }

  if (load.status !== 'AVAILABLE') {
    return { error: 'This load is no longer available' };
  }

  if (load.brokerId === actionUserId) {
    return { error: 'You cannot request your own load' };
  }

  try {
    try {
      await prisma.loadRequest.create({
        data: { 
          loadId, 
          carrierId: actionUserId, 
          status: 'PENDING',
          bidPrice
        }
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Unique constraint failed, meaning a request already exists
        const existing = await prisma.loadRequest.findUnique({
          where: { loadId_carrierId: { loadId, carrierId: actionUserId } }
        });
        
        if (existing?.status !== 'PENDING') {
          return { error: `Your request was already processed (${existing?.status})` };
        }
        
        if (bidPrice !== null) {
          // Allow updating bid if it's still pending
          await prisma.loadRequest.update({
            where: { id: existing.id },
            data: { bidPrice }
          });
        }
      } else {
        throw e;
      }
    }

    revalidatePath('/loadboard');
    return { success: true };
  } catch (error) {
    console.error('Error requesting load:', error instanceof Error ? error.message : 'Unknown error');
    return { error: 'Failed to request load' };
  }
}

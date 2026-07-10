'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/dal';
import { z } from 'zod';

export async function requestLoadAction(loadId: string, bidPrice: number | null) {
  const { userId: actionUserId, role } = await getSession();

  if (!actionUserId || role !== 'CARRIER') {
    return { error: 'Forbidden: Only carriers can request loads' };
  }

  const parsedLoadId = z.string().uuid().safeParse(loadId);
  const parsedBid = z.union([z.number().positive(), z.null()]).safeParse(bidPrice);

  if (!parsedLoadId.success || !parsedBid.success) {
    return { error: 'Invalid input parameters' };
  }

  const user = await prisma.user.findUnique({ where: { id: actionUserId }, select: { subscriptionStatus: true } });
  if (!user || ['CANCELED', 'PAST_DUE', 'NONE'].includes(user.subscriptionStatus)) {
    return { error: 'Payment required: Active subscription is needed to bid on loads.' };
  }

  try {
    const activeRequest = await prisma.loadRequest.findFirst({
      where: { loadId, carrierId: actionUserId, status: 'PENDING' }
    });

    if (!activeRequest) {
      await prisma.loadRequest.create({
        data: { 
          loadId, 
          carrierId: actionUserId, 
          status: 'PENDING',
          bidPrice
        }
      });
    } else if (bidPrice !== null) {
      // Allow updating bid if it's still pending
      await prisma.loadRequest.update({
        where: { id: activeRequest.id },
        data: { bidPrice }
      });
    }

    revalidatePath('/loadboard');
    return { success: true };
  } catch (error) {
    console.error('Error requesting load:', error instanceof Error ? error.message : 'Unknown error');
    return { error: 'Failed to request load' };
  }
}

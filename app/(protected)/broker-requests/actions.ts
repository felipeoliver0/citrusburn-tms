'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/dal';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notifications';
import { z } from 'zod';

export async function approveRequestAction(formData: FormData) {
  const { userId } = await getSession();

  if (!userId) throw new Error('Unauthorized');

  const requestIdRaw = formData.get('requestId');
  const parsed = z.string().uuid().safeParse(requestIdRaw);
  if (!parsed.success) throw new Error('Invalid request ID');
  const requestId = parsed.data;

  const request = await prisma.loadRequest.findUnique({
    where: { id: requestId },
    include: { load: true }
  });

  if (!request) throw new Error('Request not found');
  if (request.load.brokerId !== userId) throw new Error('Forbidden: Not your load');
  if (request.load.status !== 'AVAILABLE') throw new Error('Load no longer available');

  // Use a transaction to prevent race conditions (e.g. two concurrent approvals)
  await prisma.$transaction(async (tx) => {
    // Re-check inside the transaction that load is still AVAILABLE
    const freshLoad = await tx.load.findUnique({ where: { id: request.loadId }, select: { status: true } });
    if (!freshLoad || freshLoad.status !== 'AVAILABLE') {
      throw new Error('Load no longer available (concurrent update)');
    }

    // Update request to APPROVED
    await tx.loadRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' }
    });

    // Reject all other requests for this load
    await tx.loadRequest.updateMany({
      where: { loadId: request.loadId, id: { not: requestId } },
      data: { status: 'REJECTED' }
    });

    // Determine the final price (bidPrice if exists, otherwise original price)
    const finalPrice = request.bidPrice ? request.bidPrice : request.load.price;

    // Update load to BOOKED and assign Carrier with the agreed price
    await tx.load.update({
      where: { id: request.loadId },
      data: { 
        status: 'BOOKED',
        carrierId: request.carrierId,
        price: finalPrice
      }
    });
  });

  await createNotification(
    request.carrierId,
    'Bid Approved!',
    `Your bid for load #${request.loadId.substring(0,6).toUpperCase()} was approved by the broker.`,
    '/my-loads'
  );

  revalidatePath('/broker-requests');
  revalidatePath('/loadboard');
}

export async function rejectRequestAction(formData: FormData) {
  const { userId } = await getSession();

  if (!userId) throw new Error('Unauthorized');

  const requestIdRaw = formData.get('requestId');
  const parsed = z.string().uuid().safeParse(requestIdRaw);
  if (!parsed.success) throw new Error('Invalid request ID');
  const requestId = parsed.data;

  const request = await prisma.loadRequest.findUnique({
    where: { id: requestId },
    include: { load: true }
  });

  if (!request) throw new Error('Request not found');
  if (request.load.brokerId !== userId) throw new Error('Forbidden: Not your load');

  // Update request to REJECTED
  await prisma.loadRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED' }
  });

  await createNotification(
    request.carrierId,
    'Bid Rejected',
    `Your bid for load #${request.loadId.substring(0,6).toUpperCase()} was rejected by the broker.`,
    '/loadboard'
  );

  revalidatePath('/broker-requests');
}

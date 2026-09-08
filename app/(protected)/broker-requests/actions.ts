'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/dal';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notifications';
import { logAudit } from '@/lib/audit';
import { transitionLoad } from '@/lib/loadState';
import { Role } from '@prisma/client';
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
  if (request.status !== 'PENDING') throw new Error('Request is no longer pending');

  const finalPrice = request.bidPrice ? request.bidPrice : request.load.price;

  // Use a transaction with atomic update to prevent race conditions
  await prisma.$transaction(async (tx) => {
    // Atomic state transition using central state machine
    await transitionLoad(
      request.loadId,
      'BOOKED',
      userId,
      'BROKER' as Role,
      {
        carrierId: request.carrierId,
        price: finalPrice,
      },
      tx
    );

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
  });

  await createNotification(
    request.carrierId,
    'Bid Approved!',
    `Your bid for load #${request.loadId.substring(0,6).toUpperCase()} was approved by the broker.`,
    '/my-loads'
  );

  revalidatePath('/broker-requests');
  revalidatePath('/loadboard');

  await logAudit(userId, 'REQUEST_APPROVED', 'LoadRequest', requestId, { loadId: request.loadId, carrierId: request.carrierId });
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

  // Update request to REJECTED atomically, only if PENDING
  const result = await prisma.loadRequest.updateMany({
    where: { 
      id: requestId,
      status: 'PENDING'
    },
    data: { status: 'REJECTED' }
  });

  if (result.count !== 1) {
    throw new Error('Request is no longer pending');
  }

  await createNotification(
    request.carrierId,
    'Bid Rejected',
    `Your bid for load #${request.loadId.substring(0,6).toUpperCase()} was rejected by the broker.`,
    '/loadboard'
  );

  revalidatePath('/broker-requests');

  await logAudit(userId, 'REQUEST_REJECTED', 'LoadRequest', requestId, { loadId: request.loadId, carrierId: request.carrierId });
}

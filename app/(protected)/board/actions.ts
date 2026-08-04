'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/dal';
import { LoadStatus } from '@prisma/client';

export async function updateLoadStatusAction(loadId: string, newStatus: LoadStatus) {
  const { userId, role } = await getSession();

  if (!userId || (role !== 'BROKER' && role !== 'ADMIN')) {
    throw new Error('Unauthorized');
  }

  // Verify ownership
  const load = await prisma.load.findUnique({
    where: { id: loadId },
    select: { brokerId: true }
  });

  if (!load) {
    throw new Error('Load not found');
  }

  if (load.brokerId !== userId && role !== 'ADMIN') {
    throw new Error('Forbidden: You do not own this load');
  }

  // Update status
  await prisma.load.update({
    where: { id: loadId },
    data: { status: newStatus }
  });

  return { success: true };
}

'use server';

import { getSession } from '@/lib/dal';
import { LoadStatus, Role } from '@prisma/client';
import { transitionLoad } from '@/lib/loadState';

export async function updateLoadStatusAction(loadId: string, newStatus: LoadStatus) {
  const { userId, role } = await getSession();

  if (!userId || (role !== 'BROKER' && role !== 'ADMIN')) {
    throw new Error('Unauthorized');
  }

  await transitionLoad(loadId, newStatus, userId, role as Role);

  return { success: true };
}

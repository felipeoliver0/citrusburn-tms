'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/dal';
import { z } from 'zod';

export async function saveSearchAction(name: string, originCity?: string, destCity?: string) {
  const { userId, role } = await getSession();

  if (!userId || role !== 'CARRIER') return { error: 'Forbidden: Only carriers can save searches' };

  const parsedName = z.string().min(1).max(100).safeParse(name);
  const parsedOrigin = z.string().max(100).optional().safeParse(originCity);
  const parsedDest = z.string().max(100).optional().safeParse(destCity);

  if (!parsedName.success || !parsedOrigin.success || !parsedDest.success) {
    return { error: 'Invalid search parameters' };
  }

  try {
    await prisma.savedSearch.create({
      data: {
        name,
        originCity: originCity || null,
        destCity: destCity || null,
        userId
      }
    });

    revalidatePath('/loadboard');
    return { success: true };
  } catch (error) {
    console.error('Error saving search:', error instanceof Error ? error.message : 'Unknown error');
    return { error: 'Failed to save search' };
  }
}

export async function deleteSearchAction(searchId: string) {
  const { userId, role } = await getSession();

  if (!userId || role !== 'CARRIER') return { error: 'Forbidden: Only carriers can delete searches' };

  const parsedId = z.string().uuid().safeParse(searchId);
  if (!parsedId.success) {
    return { error: 'Invalid search ID' };
  }

  try {
    await prisma.savedSearch.delete({
      where: { id: searchId, userId } // Ensure it belongs to the user
    });

    revalidatePath('/loadboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting search:', error instanceof Error ? error.message : 'Unknown error');
    return { error: 'Failed to delete search' };
  }
}

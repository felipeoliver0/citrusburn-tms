'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/dal';
import { z } from 'zod';

export async function getUnreadNotifications() {
  const { userId } = await getSession();

  if (!userId) return [];

  try {
    return await prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  } catch (error) {
    console.error('Error fetching notifications:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

export async function markAsRead(notificationId: string) {
  const { userId } = await getSession();

  if (!userId) return { success: false };

  const parsedId = z.string().uuid().safeParse(notificationId);
  if (!parsedId.success) return { success: false };

  try {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true }
    });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error instanceof Error ? error.message : 'Unknown error');
    return { success: false };
  }
}

export async function markAllAsRead() {
  const { userId } = await getSession();

  if (!userId) return { success: false };

  try {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
    return { success: true };
  } catch (error) {
    console.error('Error marking all as read:', error instanceof Error ? error.message : 'Unknown error');
    return { success: false };
  }
}

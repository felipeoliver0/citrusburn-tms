import prisma from '@/lib/prisma';

/**
 * Internal function — creates a notification for a user.
 * This file does NOT have 'use server' directive, so these functions
 * are NOT exposed as Server Actions callable from the client.
 */
export async function createNotification(userId: string, title: string, message: string, link?: string) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error instanceof Error ? error.message : 'Unknown error');
  }
}

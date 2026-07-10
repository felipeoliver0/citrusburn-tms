'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/dal';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export async function resetUserPassword(formData: FormData) {
  const { userId, role } = await getSession();
  if (!userId || role !== 'ADMIN') {
    return { error: 'Unauthorized. Only admins can perform this action.' };
  }

  const parsedUserId = z.string().uuid().safeParse(formData.get('userId'));
  const parsedPassword = z.string().min(6).max(128).safeParse(formData.get('newPassword'));
  
  if (!parsedUserId.success) return { error: 'Invalid user ID' };
  if (!parsedPassword.success) return { error: 'Password must be between 6 and 128 characters' };

  const targetUserId = parsedUserId.data;
  const newPassword = parsedPassword.data;

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash }
    });

    revalidatePath('/admin/users');
    return { success: 'Password updated successfully!' };
  } catch (error) {
    console.error('Failed to reset password:', error instanceof Error ? error.message : 'Unknown error');
    return { error: 'Failed to reset password. Please try again.' };
  }
}

export async function deleteUser(formData: FormData) {
  const { userId, role } = await getSession();
  if (!userId || role !== 'ADMIN') {
    return { error: 'Unauthorized. Only admins can perform this action.' };
  }

  const parsedUserId = z.string().uuid().safeParse(formData.get('userId'));
  if (!parsedUserId.success) return { error: 'Invalid user ID' };
  const targetUserId = parsedUserId.data;
  
  if (targetUserId === userId) {
    return { error: 'You cannot delete your own admin account.' };
  }

  // Prevent deleting other admin accounts without demotion first
  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { role: true } });
  if (target?.role === 'ADMIN') {
    return { error: 'Cannot delete admin accounts. Demote the user first.' };
  }

  try {
    await prisma.user.delete({
      where: { id: targetUserId }
    });

    revalidatePath('/admin/users');
    return { success: 'User deleted successfully.' };
  } catch (error) {
    console.error('Failed to delete user:', error instanceof Error ? error.message : 'Unknown error');
    return { error: 'Failed to delete user. Please try again.' };
  }
}

export async function updateUserRole(formData: FormData) {
  const { userId, role } = await getSession();
  if (!userId || role !== 'ADMIN') {
    return { error: 'Unauthorized. Only admins can perform this action.' };
  }

  const parsedUserId = z.string().uuid().safeParse(formData.get('userId'));
  const parsedRole = z.enum(['BROKER', 'CARRIER', 'DRIVER', 'ADMIN']).safeParse(formData.get('role'));
  
  if (!parsedUserId.success || !parsedRole.success) return { error: 'Invalid input' };
  
  const targetUserId = parsedUserId.data;
  const newRole = parsedRole.data;

  try {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole }
    });

    revalidatePath('/admin/users');
    return { success: 'Role updated successfully.' };
  } catch (error) {
    console.error('Failed to update role:', error instanceof Error ? error.message : 'Unknown error');
    return { error: 'Failed to update user role.' };
  }
}

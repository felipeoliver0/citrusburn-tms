'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/dal';
import { hashPassword } from '@/lib/hash';
import { revalidatePath } from 'next/cache';
import { isRateLimited } from '@/lib/rateLimit';

import { CreateDriverSchema } from '@/lib/validations';

export async function createDriverAction(formData: FormData) {
  const { userId } = await getSession();

  if (!userId) throw new Error('Unauthorized');

  if (await isRateLimited(`fleet-create:${userId}`, 10)) {
    throw new Error('Too many drivers created recently. Please wait.');
  }

  const carrier = await prisma.user.findUnique({ where: { id: userId } });
  if (carrier?.role !== 'CARRIER') throw new Error('Only carriers can create drivers');

  const rawFullName = formData.get('fullName') as string;
  const rawEmail = formData.get('email') as string;
  const rawPassword = formData.get('password') as string;
  const rawPhone = formData.get('phone') as string;

  const parsed = CreateDriverSchema.safeParse({
    fullName: rawFullName,
    email: rawEmail,
    password: rawPassword,
    phone: rawPhone,
  });

  if (!parsed.success) {
    throw new Error(`Validation failed: ${parsed.error.issues[0].message}`);
  }

  const { fullName, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already in use');

  const hashedPassword = await hashPassword(password);

  await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      fullName,
      phone,
      role: 'DRIVER',
      employerId: userId,
      emailVerified: true
    }
  });

  revalidatePath('/fleet');
}

export async function deleteDriverAction(driverId: string) {
  const { userId } = await getSession();
  if (!userId) throw new Error('Unauthorized');

  const carrier = await prisma.user.findUnique({ where: { id: userId } });
  if (carrier?.role !== 'CARRIER') throw new Error('Only carriers can remove drivers');

  // Verify the driver belongs to this carrier
  const driver = await prisma.user.findUnique({ where: { id: driverId } });
  if (!driver || driver.employerId !== userId) {
    throw new Error('Driver not found or does not belong to you');
  }

  // Soft delete or hard delete? Hard delete for now to free up the email, 
  // or soft delete if we want to keep records. Soft delete is better.
  await prisma.user.update({
    where: { id: driverId },
    data: { deletedAt: new Date(), employerId: null }
  });

  revalidatePath('/fleet');
}

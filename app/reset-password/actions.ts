'use server';

import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { isRateLimited } from '@/lib/rateLimit';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';

export async function handleResetPassword(formData: FormData) {
  const email = formData.get('email') as string;
  const code = formData.get('code') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!email || !code || !password) {
    redirect(`/reset-password?email=${encodeURIComponent(email)}&error=Missing+fields`);
  }

  if (password !== confirmPassword) {
    redirect(`/reset-password?email=${encodeURIComponent(email)}&error=Passwords+do+not+match`);
  }

  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const ip = realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown');

  if (await isRateLimited(`reset-pw-ip:${ip}`, 10)) {
    redirect(`/reset-password?email=${encodeURIComponent(email)}&error=Too+many+attempts.+Please+try+again+later.`);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user || user.resetPasswordCode !== code) {
    redirect(`/reset-password?email=${encodeURIComponent(email)}&error=Invalid+recovery+code`);
  }

  if (user.resetPasswordExpiry && new Date() > user.resetPasswordExpiry) {
    redirect(`/forgot-password?error=Recovery+code+expired.+Please+request+a+new+one.`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { email: user.email },
    data: {
      password: hashedPassword,
      resetPasswordCode: null,
      resetPasswordExpiry: null
    }
  });

  redirect(`/reset-password?success=Password+reset+successfully`);
}

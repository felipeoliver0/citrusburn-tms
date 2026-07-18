'use server';

import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { isRateLimited } from '@/lib/rateLimit';
import { randomInt } from 'crypto';
import { Resend } from 'resend';
import { headers } from 'next/headers';

export async function handleForgotPassword(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) {
    redirect(`/forgot-password?error=Email+is+required`);
  }

  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const ip = realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown');

  // Strict rate limit to prevent spamming
  if (await isRateLimited(`forgot-pw-ip:${ip}`, 5)) {
    redirect(`/forgot-password?error=Too+many+attempts.+Please+try+again+later.`);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  // We don't want to reveal if a user exists or not to prevent enumeration attacks.
  // If the user doesn't exist, we just simulate success.
  if (!user) {
    redirect(`/reset-password?email=${encodeURIComponent(email)}`);
  }

  const code = randomInt(100000, 999999).toString();
  const codeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.user.update({
    where: { email: user.email },
    data: {
      resetPasswordCode: code,
      resetPasswordExpiry: codeExpiry
    }
  });

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'AxleGrid TMS <onboarding@resend.dev>',
      to: user.email,
      subject: 'Password Reset Request - AxleGrid TMS',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-w: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px;">
          <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            <div style="background-color: #09090b; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 800;">AxleGrid TMS</h1>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #0f172a; font-size: 20px; margin-top: 0; margin-bottom: 16px; font-weight: 700;">Password Reset</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">You requested to reset your password. Use the code below. It expires in 15 minutes.</p>
              <div style="background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px;">
                <span style="font-family: monospace; font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">${code}</span>
              </div>
            </div>
          </div>
        </div>
      `
    });
  }

  redirect(`/reset-password?email=${encodeURIComponent(email)}`);
}

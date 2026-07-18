'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/dal';
import { logAudit } from '@/lib/audit';
import { redirect } from 'next/navigation';

export async function completeOnboardingAction(formData: FormData) {
  const { userId } = await getSession();
  if (!userId) throw new Error('Unauthorized');

  const companyName = formData.get('companyName') as string;
  const companyAddress = formData.get('companyAddress') as string;
  const mcNumber = formData.get('mcNumber') as string;
  const usdotNumber = formData.get('usdotNumber') as string;

  // Basic validation
  if (!companyName) throw new Error('Company name is required');
  if (!mcNumber) throw new Error('MC Number is required');
  if (!usdotNumber) throw new Error('US DOT Number is required');

  await prisma.user.update({
    where: { id: userId },
    data: {
      companyName,
      companyAddress,
      mcNumber,
      usdotNumber,
      onboardingCompleted: true,
    }
  });

  await logAudit(userId, 'ONBOARDING_COMPLETED', 'User', userId, { companyName, mcNumber });

  redirect('/dashboard');
}

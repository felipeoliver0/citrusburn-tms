import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import prisma from '@/lib/prisma';

/**
 * Ensures the user is authenticated.
 * Use this in protected Pages and Layouts.
 * It will redirect to /login if the user is not authenticated.
 */
export const verifySession = cache(async () => {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const role = headersList.get('x-user-role');
  const onboardingCompleted = headersList.get('x-user-onboarding') === 'true';
  const sessionVersionStr = headersList.get('x-session-version');

  if (!userId) {
    redirect('/login');
  }

  const sessionVersion = sessionVersionStr ? parseInt(sessionVersionStr, 10) : 0;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessionVersion: true }
  });

  if (!user || user.sessionVersion !== sessionVersion) {
    redirect('/login?error=Session+expired.+Please+log+in+again.');
  }

  return { isAuth: true, userId, role, onboardingCompleted };
});

/**
 * Gets the current session data without redirecting.
 * Use this in Server Actions and API Routes.
 */
export const getSession = cache(async () => {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const role = headersList.get('x-user-role');
  const onboardingCompleted = headersList.get('x-user-onboarding') === 'true';
  const sessionVersionStr = headersList.get('x-session-version');
  
  if (!userId) {
    return { isAuth: false, userId: null, role: null, onboardingCompleted: false };
  }

  const sessionVersion = sessionVersionStr ? parseInt(sessionVersionStr, 10) : 0;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessionVersion: true }
  });

  if (!user || user.sessionVersion !== sessionVersion) {
    return { isAuth: false, userId: null, role: null, onboardingCompleted: false };
  }

  return { isAuth: true, userId, role, onboardingCompleted };
});

import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

/**
 * Ensures the user is authenticated.
 * Use this in protected Pages and Layouts.
 * It will redirect to /login if the user is not authenticated.
 */
export const verifySession = cache(async () => {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const role = headersList.get('x-user-role');

  if (!userId) {
    redirect('/login');
  }

  return { isAuth: true, userId, role };
});

/**
 * Gets the current session data without redirecting.
 * Use this in Server Actions and API Routes.
 */
export const getSession = cache(async () => {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const role = headersList.get('x-user-role');
  
  return { isAuth: !!userId, userId, role };
});

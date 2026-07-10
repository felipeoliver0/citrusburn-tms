import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, signToken } from './lib/auth';
import { getRoleRedirect } from './lib/rbac';

// Routes that are explicitly public (no auth required)
const publicPaths = ['/', '/login', '/register', '/verify', '/terms', '/privacy', '/logout'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Global Security: Strip spoofed auth headers on ALL requests ---
  // Prevents external clients from injecting x-user-id / x-user-role
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-user-id');
  requestHeaders.delete('x-user-role');

  // Determine if this is a public path
  const isPublicPath =
    publicPaths.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/workbox-');

  // Cron routes use their own Bearer token auth
  const isCronRoute = pathname.startsWith('/api/cron');
  const isStripeWebhook = pathname === '/api/stripe/webhook';

  if (isPublicPath || isCronRoute || isStripeWebhook) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // --- Everything else requires authentication ---
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // API routes get a JSON 401, pages get redirected
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL('/login', request.url);
    url.searchParams.set('error', 'Please log in to access this page.');
    return NextResponse.redirect(url);
  }

  try {
    const payload = await verifyToken(token);

    // Inject verified user info into downstream headers
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);

    const roleRedirect = getRoleRedirect(payload.role, pathname);
    if (roleRedirect && !pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL(roleRedirect, request.url));
    }

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // Sliding session: If token expires in less than 1 hour, issue a new one
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && (payload.exp - currentTime < 3600)) {
      const newToken = await signToken({ userId: payload.userId, role: payload.role });
      response.cookies.set({
        name: 'auth_token',
        value: newToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7200, // 2 hours in seconds
        path: '/'
      });
    }

    return response;
  } catch (error) {
    // Invalid/expired token
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const response = NextResponse.redirect(
      new URL('/login?error=Session+expired.+Please+log+in+again.', request.url)
    );
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

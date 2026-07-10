type Role = 'BROKER' | 'CARRIER' | 'DRIVER' | 'ADMIN' | 'DEALER';

interface RouteRule {
  prefix: string;
  roles: Role[];
}

const ROUTE_RULES: RouteRule[] = [
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/broker-requests', roles: ['BROKER', 'DEALER'] },
  { prefix: '/fleet', roles: ['CARRIER'] },
  { prefix: '/driver', roles: ['DRIVER'] },
];

const ROLE_HOME: Record<Role, string> = {
  BROKER: '/dashboard',
  CARRIER: '/dashboard',
  DRIVER: '/driver',
  ADMIN: '/dashboard',
  DEALER: '/dashboard',
};

/**
 * Returns a redirect path if the role cannot access the pathname, otherwise null.
 */
export function getRoleRedirect(role: string, pathname: string): string | null {
  if (role === 'DRIVER' && (pathname === '/dashboard' || pathname.startsWith('/loadboard'))) {
    return '/driver';
  }

  if (role === 'DRIVER' && (pathname === '/new-load' || pathname.startsWith('/my-loads') || pathname.startsWith('/fleet'))) {
    return '/driver';
  }

  if ((role === 'BROKER' || role === 'DEALER') && pathname.startsWith('/fleet')) {
    return '/dashboard';
  }

  if (role === 'CARRIER' && pathname.startsWith('/broker-requests')) {
    return '/dashboard';
  }

  for (const rule of ROUTE_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      if (!rule.roles.includes(role as Role)) {
        return ROLE_HOME[role as Role] ?? '/dashboard';
      }
    }
  }

  return null;
}

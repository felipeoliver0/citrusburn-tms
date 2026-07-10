'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const pathname = usePathname();
  if (!pathname || pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);
  
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 font-medium h-10">
      <Link href="/dashboard" className="hover:text-gray-900 transition-colors flex items-center">
        <Home size={16} />
      </Link>
      
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        // Prevent extremely long UUIDs in breadcrumbs
        const isUUID = segment.length > 20 && segment.includes('-');
        const title = isUUID 
          ? `...${segment.slice(-6)}`
          : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

        return (
          <div key={href} className="flex items-center space-x-2">
            <ChevronRight size={14} className="text-gray-300" />
            {isLast ? (
              <span className="text-gray-900 font-bold">{title}</span>
            ) : (
              <Link href={href} className="hover:text-gray-900 transition-colors">
                {title}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

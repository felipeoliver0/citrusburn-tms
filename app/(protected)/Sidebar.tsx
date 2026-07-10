'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Truck, Map, Settings, LogOut, User, ShieldCheck, Users, Package } from 'lucide-react';
import { useState, ReactNode } from 'react';

export default function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-xl shadow-md border border-gray-200 text-gray-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'} 
        w-64 bg-gray-900 border-r border-gray-800 flex flex-col shadow-xl
      `}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:block absolute -right-3 top-8 bg-gray-800 border border-gray-700 text-gray-400 rounded-full p-1 hover:bg-gray-700 hover:text-white transition-colors z-50 shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isCollapsed ? 'rotate-180' : ''}>
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute right-4 top-6 text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <div className={`p-6 flex items-center ${isCollapsed ? 'md:justify-center md:px-0' : 'gap-3'}`}>
        <Link href={userRole === 'DRIVER' ? '/driver' : '/dashboard'} className="flex items-center gap-3">
          <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center font-bold shadow-md shadow-brand-500/20 text-white">A</div>
          <span className={`font-bold text-xl tracking-tight text-white truncate ${isCollapsed ? 'md:hidden' : ''}`}>America Dispatch</span>
        </Link>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {userRole !== 'DRIVER' && (
          <NavItem href="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" pathname={pathname} isCollapsed={isCollapsed} />
        )}
        
        {userRole === 'BROKER' && (
          <NavItem href="/broker-requests" icon={<ShieldCheck size={20} />} label="Requests" pathname={pathname} isCollapsed={isCollapsed} />
        )}
        
        {userRole !== 'DRIVER' && (
          <NavItem href="/loadboard" icon={<Map size={20} />} label="Loadboard" pathname={pathname} isCollapsed={isCollapsed} />
        )}
        
        {userRole === 'BROKER' && (
          <NavItem href="/new-load" icon={<Package size={20} />} label="Post Load" pathname={pathname} isCollapsed={isCollapsed} />
        )}

        {(userRole === 'CARRIER' || userRole === 'BROKER') && (
          <NavItem href="/my-loads" icon={<Truck size={20} />} label="My Loads" pathname={pathname} isCollapsed={isCollapsed} />
        )}

        {userRole === 'CARRIER' && (
          <NavItem href="/fleet" icon={<Users size={20} />} label="Fleet" pathname={pathname} isCollapsed={isCollapsed} />
        )}

        {userRole === 'DRIVER' && (
          <NavItem href="/driver" icon={<Truck size={20} />} label="My Route" pathname={pathname} isCollapsed={isCollapsed} />
        )}

        <NavItem href="/account" icon={<User size={20} />} label="Account" pathname={pathname} isCollapsed={isCollapsed} />
        <NavItem href="/settings" icon={<Settings size={20} />} label="Settings" pathname={pathname} isCollapsed={isCollapsed} />
        
        {userRole === 'ADMIN' && (
          <NavItem href="/admin/users" icon={<ShieldCheck size={20} />} label="Admin Panel" pathname={pathname} isCollapsed={isCollapsed} />
        )}
      </nav>
      <div className="p-4 border-t border-gray-800 flex justify-center">
        <form action="/logout" method="POST" className="w-full">
          <button type="submit" className={`flex items-center gap-3 ${isCollapsed ? 'md:px-2 md:justify-center md:w-10 md:h-10 px-4' : 'px-4'} py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all group w-full`}>
            <LogOut size={20} className={!isCollapsed ? "group-hover:translate-x-1 transition-transform" : "md:group-hover:translate-x-0 group-hover:translate-x-1 transition-transform"} />
            <span className={`font-medium ${isCollapsed ? 'md:hidden' : ''}`}>Logout</span>
          </button>
        </form>
      </div>
    </aside>
    </>
  );
}

function NavItem({ href, icon, label, pathname, isCollapsed }: { href: string, icon: ReactNode, label: string, pathname: string | null, isCollapsed: boolean }) {
  const active = pathname?.startsWith(href);

  return (
    <Link 
      href={href} 
      title={isCollapsed ? label : ''}
      className={`flex items-center ${isCollapsed ? 'md:justify-center md:px-0 md:w-12 md:h-12 mx-auto gap-3 px-4 py-3' : 'gap-3 px-4 py-3'} rounded-xl transition-all duration-300 ${
        active 
          ? 'bg-brand-500/20 text-brand-400 font-semibold shadow-inner' 
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      <div className={`${active ? 'scale-110 drop-shadow-sm' : ''} transition-transform`}>
        {icon}
      </div>
      <span className={isCollapsed ? 'md:hidden' : ''}>{label}</span>
    </Link>
  );
}

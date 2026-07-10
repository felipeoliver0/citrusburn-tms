'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { getUnreadNotifications, markAsRead, markAllAsRead } from '@/app/actions/notifications';
import Link from 'next/link';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    const data = await getUnreadNotifications();
    setNotifications(data || []);
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  async function handleMarkAsRead(id: string) {
    await markAsRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  async function handleMarkAll() {
    await markAllAsRead();
    setNotifications([]);
    setIsOpen(false);
  }

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-all shadow-sm"
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            {notifications.length > 0 && (
              <button 
                onClick={handleMarkAll}
                className="text-[10px] uppercase font-bold text-brand-600 hover:text-brand-800 tracking-wider"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No new notifications.
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors group relative">
                  <div className="pr-6">
                    <h4 className="text-sm font-bold text-gray-900">{notif.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                    <div className="text-[10px] text-gray-400 mt-2 font-bold uppercase">
                      {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="absolute top-4 right-4 text-gray-300 hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                  {notif.link && (
                    <Link 
                      href={notif.link}
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="absolute inset-0 z-0"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

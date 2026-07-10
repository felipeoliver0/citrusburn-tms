import prisma from '@/lib/prisma';
import { getSession } from '@/lib/dal';
import { redirect } from 'next/navigation';
import { ShieldCheck, Mail, Building2 } from 'lucide-react';
import UserRowActions from './UserRowActions';

export default async function AdminUsersPage() {
  const { userId, role } = await getSession();

  if (!userId || role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 pb-10">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">System Users</h1>
          <p className="text-gray-500 mt-2 text-lg">Manage all accounts across the platform.</p>
        </div>
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full border border-red-200 shadow-sm flex items-center gap-2">
          <ShieldCheck size={18} />
          <span className="text-sm font-bold tracking-wider uppercase">Master Admin</span>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-xs font-bold">
              <tr>
                <th className="px-6 py-4">User & Role</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  
                  {/* USER & ROLE */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 shadow-sm border border-gray-200">
                        {user.companyName ? user.companyName.substring(0, 2).toUpperCase() : user.fullName?.substring(0, 2).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-base">{user.companyName || user.fullName || 'Unnamed'}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            user.role === 'ADMIN' ? 'bg-red-50 text-red-600 border-red-200' :
                            user.role === 'BROKER' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                            user.role === 'CARRIER' ? 'bg-brand-50 text-brand-600 border-brand-200' :
                            'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* CONTACT INFO */}
                  <td className="px-6 py-4 space-y-1">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={14} className="text-gray-400" /> {user.email}
                    </div>
                    {user.mcNumber && (
                      <div className="flex items-center gap-2 text-gray-600 text-xs">
                        <ShieldCheck size={14} className="text-gray-400" /> MC: {user.mcNumber}
                      </div>
                    )}
                    {user.companyAddress && (
                      <div className="flex items-center gap-2 text-gray-600 text-xs">
                        <Building2 size={14} className="text-gray-400" /> {user.companyAddress.substring(0, 30)}...
                      </div>
                    )}
                  </td>

                  {/* JOINED */}
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-right">
                    <UserRowActions userId={user.id} currentRole={user.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

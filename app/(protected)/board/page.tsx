import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import KanbanBoard from '@/app/components/KanbanBoard';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BoardPage() {
  const session = await verifySession();

  if (session.role !== 'BROKER' && session.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Busca as cargas do Broker logado, ignorando as canceladas (caso existissem)
  const loads = await prisma.load.findMany({
    where: { 
      brokerId: session.userId,
      status: { in: ['AVAILABLE', 'BOOKED', 'IN_TRANSIT', 'DELIVERED'] }
    },
    select: {
      id: true,
      originCity: true,
      destCity: true,
      price: true,
      status: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6 animate-fade-in text-gray-900">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Dispatch <span className="text-brand-500">Board</span>
        </h1>
        <p className="text-gray-500 mt-2 text-sm">Drag and drop loads to update their real-time status.</p>
      </header>

      <KanbanBoard initialLoads={loads} />
    </div>
  );
}

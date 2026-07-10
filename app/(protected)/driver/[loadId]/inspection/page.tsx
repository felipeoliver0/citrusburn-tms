import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import { redirect } from 'next/navigation';
import InspectionClient from './InspectionClient';

export default async function InspectionPage({
  params
}: {
  params: Promise<{ loadId: string }>
}) {
  const { loadId } = await params;
  const { userId } = await verifySession();

  const load = await prisma.load.findUnique({
    where: { id: loadId }
  });

  if (!load) {
    return <div className="text-white p-8">Load not found.</div>;
  }

  // Security check: Must be the carrier or driver
  if (load.carrierId !== userId && load.driverId !== userId) {
    return <div className="text-white p-8">Forbidden: You are not assigned to this load.</div>;
  }

  // Determine if this is a pickup or delivery inspection based on status
  if (load.status !== 'BOOKED' && load.status !== 'IN_TRANSIT') {
    return (
      <div className="text-white p-8 glass-panel border border-white/10 rounded-xl m-6 bg-zinc-900/40">
        Inspection no longer required or load is completed.
      </div>
    );
  }

  const type = load.status === 'BOOKED' ? 'pickup' : 'delivery';

  return (
    <InspectionClient 
      loadId={load.id} 
      type={type} 
      origin={load.originCity} 
      dest={load.destCity} 
      initialVin={type === 'delivery' ? (load.pickupVin || '') : ''}
    />
  );
}

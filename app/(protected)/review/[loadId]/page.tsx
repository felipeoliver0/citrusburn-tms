import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifySession } from '@/lib/dal';
import ReviewForm from '@/app/components/ReviewForm';

export default async function ReviewPage({ 
  params 
}: { 
  params: Promise<{ loadId: string }> 
}) {
  const { userId } = await verifySession();

  const resolvedParams = await params;
  const loadId = resolvedParams.loadId;

  const load = await prisma.load.findUnique({
    where: { id: loadId },
    include: { broker: true, carrier: true, reviews: { where: { authorId: userId } } }
  });

  if (!load || load.status !== 'DELIVERED') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-6">
        <div className="text-6xl mb-4">📋</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reviews Not Available</h1>
        <p className="text-gray-500 mb-6 max-w-md">Reviews can only be submitted after the load has been marked as delivered.</p>
        <Link href="/my-loads" className="bg-brand-600 text-gray-900 font-bold py-3 px-6 rounded-lg uppercase text-xs tracking-wider">
          Back to Dispatches
        </Link>
      </div>
    );
  }

  const alreadyReviewed = load.reviews.length > 0;

  // Determine who the current user needs to review
  const isBroker = load.brokerId === userId;
  const isCarrier = load.carrierId === userId;

  // Broker reviews the Carrier. Carrier reviews the Broker.
  const targetUser = isBroker ? load.carrier : load.broker;
  const targetRole = isBroker ? 'Carrier' : 'Broker';

  return (
    <div className="w-full">
      <div className="max-w-lg mx-auto space-y-6">
        
        {/* Header */}
        <header className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
          <div className="text-4xl mb-3">⭐</div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Rate Your Partner</h1>
          <p className="text-gray-500 text-sm mt-1">
            Load <span className="font-mono font-bold text-gray-900">#{load.id.substring(0,8).toUpperCase()}</span>
          </p>
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 text-left">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 font-bold uppercase text-[10px]">Origin</span>
                <div className="font-bold text-gray-900">{load.originCity}</div>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase text-[10px]">Destination</span>
                <div className="font-bold text-gray-900">{load.destCity}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Review Form or Already Reviewed Message */}
        {alreadyReviewed ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-sm font-bold text-green-700">You&apos;ve already submitted a review for this load.</div>
            <div className="text-xs text-green-600 mt-1">Thank you for your feedback!</div>
          </div>
        ) : targetUser ? (
          <ReviewForm 
            loadId={load.id} 
            targetId={targetUser.id} 
            targetName={targetUser.companyName || targetUser.fullName || 'Company'} 
            targetRole={targetRole}
          />
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">⚠️</div>
            <div className="text-sm font-bold text-amber-700">No partner to review.</div>
          </div>
        )}

        <div className="text-center">
          <Link href="/my-loads" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
            &larr; Back to Dispatches
          </Link>
        </div>
      </div>
    </div>
  );
}

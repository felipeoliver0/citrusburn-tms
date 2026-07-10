'use client';
import dynamic from 'next/dynamic';

const LiveTrackerMap = dynamic(() => import('@/app/components/LiveTrackerMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Loading Route Map...</div>
});

export default function LiveTrackerMapClient(props: any) {
  return <LiveTrackerMap {...props} />;
}

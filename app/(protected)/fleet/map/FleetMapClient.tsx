'use client';
import dynamic from 'next/dynamic';

const FleetMap = dynamic(() => import('@/app/components/FleetMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-[70vh] min-h-[500px] bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center text-gray-400 border-4 border-gray-200">Loading Map Engine...</div>
});

export default function FleetMapClient(props: any) {
  return <FleetMap {...props} />;
}

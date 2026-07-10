'use client';
import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchSidebar from './SearchSidebar';
import LoadCard from './LoadCard';
import dynamic from 'next/dynamic';
import { Map, List } from 'lucide-react';

const MapViewer = dynamic(() => import('./MapViewer'), { ssr: false, loading: () => <div className="h-full w-full bg-gray-100 animate-pulse rounded-2xl border border-gray-200 flex items-center justify-center text-gray-400">Loading Map...</div> });

export default function LoadboardClient({ availableLoads, savedSearches, currentUser, page = 1, totalPages = 1, totalCount = 0 }: { availableLoads: any[], savedSearches: any[], currentUser: any, page?: number, totalPages?: number, totalCount?: number }) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <SearchSidebar savedSearches={savedSearches} />

      <div className="flex-1 flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm gap-3 sm:gap-0">
          <div className="text-sm font-bold text-gray-500">
            Available Loads: <span className="text-brand-600 font-black">{totalCount}</span>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 w-full sm:w-auto">
            <button 
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${viewMode === 'list' ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <List size={18} /> List
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${viewMode === 'map' ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Map size={18} /> Map
            </button>
          </div>
        </div>

        <div className="flex-1 relative rounded-2xl">
          {viewMode === 'list' ? (
            availableLoads.length === 0 ? (
              <div className="p-12 text-center bg-white border border-gray-200 rounded-2xl text-gray-400 mt-4 h-full flex items-center justify-center shadow-sm">
                <div>
                  <Map size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No loads available currently.</p>
                  <p className="text-sm mt-2 opacity-70">Try adjusting your search filters.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mt-1">
                {availableLoads.map(load => {
                  const isPending = load.requests.some((req: any) => req.carrierId === currentUser.id && req.status === 'PENDING');
                  return <LoadCard key={load.id} load={load} currentUser={currentUser} isPending={isPending} />;
                })}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center bg-white border border-gray-200 rounded-xl p-4 shadow-sm mt-4">
                    <button 
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                      className="px-4 py-2 text-sm font-bold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-medium text-gray-500">
                      Page <strong className="text-brand-600">{page}</strong> of {totalPages}
                    </span>
                    <button 
                      disabled={page >= totalPages}
                      onClick={() => handlePageChange(page + 1)}
                      className="px-4 py-2 text-sm font-bold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="h-full min-h-[600px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-xl relative z-0">
              <MapViewer loads={availableLoads} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

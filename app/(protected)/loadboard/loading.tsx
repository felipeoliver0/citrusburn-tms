export default function LoadboardLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:flex-row bg-gray-50 animate-pulse w-full">
      
      {/* Sidebar Skeleton */}
      <aside className="w-full lg:w-80 border-r border-gray-200 bg-white flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-gray-100 ">
          <div className="h-10 w-full bg-gray-100 rounded-xl"></div>
        </div>
        
        {/* Skeleton Load Cards */}
        <div className="flex-1 overflow-hidden p-3 space-y-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4 h-32 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-5 w-40 bg-gray-200 rounded"></div>
                <div className="h-5 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Map/Content Skeleton */}
      <main className="flex-1 relative bg-gray-100 flex items-center justify-center h-full">
        <div className="text-gray-400 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-gray-300 "></div>
          </div>
          <div className="h-4 w-48 bg-gray-200 rounded-lg"></div>
        </div>
      </main>

    </div>
  );
}

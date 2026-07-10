export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-32 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded-xl"></div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 h-32 flex flex-col justify-between">
            <div className="h-4 w-24 bg-gray-100 rounded"></div>
            <div className="h-8 w-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 h-96">
          <div className="h-6 w-48 bg-gray-200 rounded-lg mb-8"></div>
          <div className="h-64 w-full bg-gray-100 rounded-xl"></div>
        </div>
        <div className="bg-white border border-gray-100 rounded-3xl p-6 h-96">
          <div className="h-6 w-40 bg-gray-200 rounded-lg mb-8"></div>
          <div className="h-48 w-48 mx-auto bg-gray-100 rounded-full mt-4"></div>
        </div>
      </div>
    </div>
  );
}

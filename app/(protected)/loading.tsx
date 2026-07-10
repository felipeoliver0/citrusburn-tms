export default function ProtectedLoading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      <div className="flex justify-between items-end mb-8">
        <div className="space-y-3">
          <div className="h-10 w-64 bg-gray-200 rounded-xl"></div>
          <div className="h-5 w-96 bg-gray-100 rounded-lg"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl h-40 p-6 flex flex-col justify-between shadow-sm">
            <div className="h-6 w-32 bg-gray-200 rounded-md"></div>
            <div className="h-10 w-24 bg-gray-100 rounded-md"></div>
          </div>
        ))}
      </div>

      <div className="space-y-4 mt-8">
        <div className="h-8 w-48 bg-gray-200 rounded-lg mb-4"></div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl h-24 p-5 flex items-center justify-between shadow-sm">
             <div className="flex gap-4">
               <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
               <div className="space-y-2">
                 <div className="h-5 w-40 bg-gray-200 rounded-md"></div>
                 <div className="h-4 w-24 bg-gray-100 rounded-md"></div>
               </div>
             </div>
             <div className="h-10 w-32 bg-gray-100 rounded-xl"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

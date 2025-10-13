// src/components/ShimmerDetail.jsx

function ShimmerDetail() {
  return (
    <div className="bg-gray-900 min-h-screen animate-pulse">
      {/* --- HERO SKELETON --- */}
      <div className="w-full min-h-[50vh] md:min-h-[60vh] bg-gray-800 relative flex items-end">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-8 flex items-end gap-8">
          <div className="w-40 md:w-52 flex-shrink-0 -mb-24 md:-mb-32 h-60 md:h-72 bg-gray-700 rounded-xl" />
          <div className="flex-1 space-y-3">
            <div className="h-10 md:h-14 bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-700 rounded w-1/2" />
            <div className="h-10 w-44 bg-gray-700 rounded-full" />
          </div>
        </div>
      </div>

      {/* --- TABBED CONTENT SKELETON --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-24 md:mt-32">
        <div className="border-b border-gray-700 mb-6 flex space-x-4">
          <div className="h-9 w-24 bg-gray-700 rounded-full" />
          <div className="h-9 w-28 bg-gray-700 rounded-full" />
          <div className="h-9 w-20 bg-gray-700 rounded-full" />
        </div>
        
        {/* Synopsis Tab Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="h-8 w-1/3 bg-gray-700 rounded" />
            <div className="h-5 bg-gray-700 rounded" />
            <div className="h-5 bg-gray-700 rounded w-5/6" />
            <div className="h-5 bg-gray-700 rounded w-4/5" />
          </div>
          <div className="space-y-4">
            <div className="h-8 w-1/2 bg-gray-700 rounded" />
            <div className="h-12 bg-gray-700 rounded-lg" />
            <div className="h-12 bg-gray-700 rounded-lg" />
            <div className="h-12 bg-gray-700 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShimmerDetail;

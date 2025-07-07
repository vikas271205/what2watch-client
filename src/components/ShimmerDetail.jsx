function ShimmerDetail() {
  return (
    <div className="w-full max-w-6xl animate-pulse space-y-6 px-4 pt-28 mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-72 h-[420px] bg-gray-800 rounded-lg" />
        <div className="flex-1 space-y-4">
          <div className="h-10 bg-gray-700 rounded w-3/4" />
          <div className="h-5 bg-gray-700 rounded w-1/2" />
          <div className="flex gap-2 flex-wrap">
            {Array(4).fill().map((_, i) => (
              <div key={i} className="h-6 w-20 bg-gray-700 rounded-full" />
            ))}
          </div>
          <div className="h-4 bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-700 rounded w-5/6" />
          <div className="h-4 bg-gray-700 rounded w-2/3" />
        </div>
      </div>
      <div className="h-64 bg-gray-800 rounded-lg" />
    </div>
  );
}

export default ShimmerDetail;

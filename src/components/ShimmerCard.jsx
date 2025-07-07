function ShimmerCard({ type = "poster", className = "" }) {
  if (type === "poster") {
    return (
      <div
        className={`bg-gray-800 animate-pulse rounded-lg ${className} w-40 h-64 md:w-48 md:h-72`}
      />
    );
  }

  if (type === "text-block") {
    return (
      <div className={`animate-pulse space-y-3 ${className}`}>
        <div className="h-6 bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-700 rounded w-5/6" />
        <div className="h-4 bg-gray-700 rounded w-2/3" />
      </div>
    );
  }

  if (type === "circle") {
    return (
      <div
        className={`w-12 h-12 rounded-full bg-gray-700 animate-pulse ${className}`}
      />
    );
  }

  return <div className="bg-gray-800 animate-pulse rounded-lg h-24 w-full" />;
}

export default ShimmerCard;

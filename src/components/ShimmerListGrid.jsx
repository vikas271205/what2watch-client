// src/components/ShimmerListGrid.jsx
import ShimmerCard from "./ShimmerCard";

function ShimmerListGrid({ count = 10 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerCard key={i} />
      ))}
    </div>
  );
}

export default ShimmerListGrid;

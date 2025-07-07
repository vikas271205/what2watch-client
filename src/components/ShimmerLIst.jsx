import ShimmerCard from "./ShimmerCard";

function ShimmerList({ count = 5, type = "poster" }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerCard key={i} type={type} />
      ))}
    </div>
  );
}

export default ShimmerList;

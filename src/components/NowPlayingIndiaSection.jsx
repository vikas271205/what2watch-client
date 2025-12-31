// src/components/TrendingOnOTTIndia.jsx
import { useEffect, useRef, useState } from "react";
import { Tv, ChevronLeft, ChevronRight } from "lucide-react";
import API_BASE from "../utils/api";
import MovieCard from "./MovieCard";

export default function TrendingOnOTTIndia() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/ott/trending`);
        const data = await res.json();

        if (mounted && Array.isArray(data)) {
          setItems(data);
        }
      } catch (err) {
        console.error("[OTT FRONTEND]", err);
        setItems([]);
      } finally {
        mounted && setLoading(false);
      }
    };

    load();
    return () => (mounted = false);
  }, []);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left"
        ? -scrollRef.current.offsetWidth
        : scrollRef.current.offsetWidth,
      behavior: "smooth",
    });
  };

  if (!items.length && !loading) return null;

  return (
    <section className="relative mt-14">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Tv className="text-red-500" size={22} />
        <h2 className="text-lg font-semibold text-white">
          Trending on Indian OTT
        </h2>
      </div>

      {/* Loading */}
{loading ? (
  <div className="relative">
    <div
      className="grid grid-flow-col
                 auto-cols-[140px]
                 sm:auto-cols-[160px]
                 lg:auto-cols-[180px]
                 gap-4 overflow-x-hidden py-2"
    >
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="relative aspect-[2/3] rounded-lg overflow-hidden
                     bg-gray-800/80 animate-pulse"
        >
          {/* fake poster shine */}
          <div className="absolute inset-0 bg-gradient-to-br
                          from-gray-700/30
                          via-gray-600/10
                          to-gray-700/30" />

          {/* fake rating bubble */}
          <div className="absolute top-2 left-2
                          w-8 h-8 rounded-full
                          bg-black/40" />

          {/* fake title bar */}
          <div className="absolute bottom-2 left-2 right-2
                          h-3 rounded bg-black/40" />
        </div>
      ))}
    </div>
  </div>
) : (

        <div className="relative group">
          <div
            ref={scrollRef}
            className="grid grid-flow-col
                       auto-cols-[140px]
                       sm:auto-cols-[160px]
                       lg:auto-cols-[180px]
                       gap-4 overflow-x-auto no-scrollbar py-2"
          >
                      {items.map((item) => (
                        <MovieCard
                          key={item.id}
                          id={item.id}                 // ✅ FIXED
                          title={item.title}
                          imageUrl={item.poster}
                          year={item.year}
                          tmdbRating={item.rating}
                          isTV
                        />
                      ))}

          </div>

          {/* Arrows */}
          <button
            onClick={() => scroll("left")}
            className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-4
                       bg-black/60 p-2 rounded-full
                       opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => scroll("right")}
            className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4
                       bg-black/60 p-2 rounded-full
                       opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </section>
  );
}

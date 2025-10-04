import { useEffect, useState, useRef } from "react";
import API_BASE from "../utils/api";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Tv } from "lucide-react";
import LandscapeCard from "./LandscapeCard"; // Use the new card
import ShimmerCard from "./ShimmerCard"; // Assuming a generic shimmer card exists

function TVSection() {
  const [tvShows, setTVShows] = useState([]);
  const scrollRef = useRef();
  const [isSectionLoading, setIsSectionLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingTV = async () => {
      setIsSectionLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/trending?time=week`);
        const data = await res.json();

        if (!Array.isArray(data)) {
          console.error("Trending API did not return an array:", data);
          setTVShows([]);
          return;
        }

        const filtered = data
          .filter((item) => item.media_type === "tv" && item.backdrop_path) // Ensure backdrop_path exists
          .slice(0, 15);

        const formatted = filtered.map((tv) => ({
            id: tv.id,
            title: tv.name,
            // Use backdrop_path for a wider image
            backdropUrl: `https://image.tmdb.org/t/p/w780${tv.backdrop_path}`,
            isTV: true,
        }));

        setTVShows(formatted);
      } catch (err) {
        console.error("Failed to fetch trending TV shows:", err);
        setTVShows([]);
      } finally {
        setIsSectionLoading(false);
      }
    };
    fetchTrendingTV();
  }, []);

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = current.offsetWidth;
      current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Tv className="text-gray-700 dark:text-indigo-400" size={28} />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Trending TV Shows This Week
          </h2>
        </div>
        <Link to="/tvshows" className="text-xs font-semibold bg-gray-100 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
          See All
        </Link>
      </div>

      {isSectionLoading ? (
        <div className="grid grid-flow-col auto-cols-[calc(100%/1.2)] sm:auto-cols-[calc(100%/2.2)] lg:auto-cols-[calc(100%/3.2)] gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => <div key={i} className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : tvShows.length > 0 ? (
        <div className="relative">
          {/* Adjusted grid layout for wider cards */}
          <div ref={scrollRef} className="grid grid-flow-col auto-cols-[calc(100%/1.2)] sm:auto-cols-[calc(100%/2.2)] lg:auto-cols-[calc(100%/3.2)] gap-4 overflow-x-auto no-scrollbar py-4 scroll-smooth">
            {tvShows.map((tvShow) => <LandscapeCard key={tvShow.id} {...tvShow} />)}
          </div>
          <button onClick={() => scroll('left')} className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-4 bg-white/80 dark:bg-white/10 backdrop-blur-sm p-2 rounded-full text-gray-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white dark:hover:bg-white/20 z-10 shadow-md" aria-label="Scroll left">
            <ChevronLeft size={24} />
          </button>
          <button onClick={() => scroll('right')} className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4 bg-white/80 dark:bg-white/10 backdrop-blur-sm p-2 rounded-full text-gray-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white dark:hover:bg-white/20 z-10 shadow-md" aria-label="Scroll right">
            <ChevronRight size={24} />
          </button>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No TV shows found at the moment.</p>
      )}
    </div>
  );
}

export default TVSection;
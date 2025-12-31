import { useEffect, useState } from "react";
import API_BASE from "../utils/api";
import { Link } from "react-router-dom";
import { Tv } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LandscapeCard from "./LandscapeCard";

const ROTATION_INTERVAL = 7000; // 7 seconds
const MAX_SHOWS = 10;

function TVSection() {
  const [tvShows, setTVShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Fetch
  useEffect(() => {
    const fetchTrendingTV = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/trending?time=day`);
        const data = await res.json();

        if (!Array.isArray(data)) {
          setTVShows([]);
          return;
        }

        const formatted = data
          .filter((i) => i.media_type === "tv" && i.backdrop_path)
          .slice(0, MAX_SHOWS)
.map((tv) => ({
  id: tv.id,
  title: tv.name,
  backdropLarge: `https://image.tmdb.org/t/p/w1280${tv.backdrop_path}`,
  backdropSmall: `https://image.tmdb.org/t/p/w780${tv.backdrop_path}`,
  firstAirYear: tv.first_air_date?.slice(0, 4),
  tmdbRating: tv.vote_average,
  popularity: tv.popularity,
  voteCount: tv.vote_count,
  isTV: true,
}));


        setTVShows(formatted);
      } catch (err) {
        console.error("TV fetch failed", err);
        setTVShows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTV();
  }, []);

  // Auto-rotation (mobile + desktop)
  useEffect(() => {
    if (!tvShows.length) return;

    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % tvShows.length);
    }, ROTATION_INTERVAL);

    return () => clearInterval(id);
  }, [tvShows]);

if (loading) {
  return (
    <section className="relative">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-gray-700 animate-pulse" />
          <div className="h-6 w-64 rounded bg-gray-700 animate-pulse" />
        </div>
        <div className="h-4 w-16 rounded bg-gray-700 animate-pulse" />
      </div>

      {/* Desktop / Tablet skeleton */}
      <div className="hidden md:grid grid-cols-[2fr_1fr] gap-6">
        {/* Featured */}
        <div className="aspect-video rounded-xl bg-gray-800 animate-pulse" />

        {/* Side queue */}
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex-1 aspect-video rounded-xl bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Mobile skeleton */}
      <div className="md:hidden space-y-4">
        <div className="aspect-video rounded-xl bg-gray-800 animate-pulse" />
        {[1, 2].map((i) => (
          <div
            key={i}
            className="aspect-video rounded-xl bg-gray-800 animate-pulse"
          />
        ))}
      </div>
    </section>
  );
}


  if (!tvShows.length) return null;

  const featured = tvShows[activeIndex];
  const sideShows = tvShows
    .slice(activeIndex + 1, activeIndex + 3)
    .concat(tvShows.slice(0, Math.max(0, activeIndex + 3 - tvShows.length)));

  return (
    <section className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Tv className="text-indigo-400" size={26} />
          <h2 className="text-2xl font-bold text-white">
            Trending TV Shows This Week
          </h2>
        </div>
        <Link
          to="/tvshows"
          className="text-sm font-medium text-indigo-400 hover:underline"
        >
          See all
        </Link>
      </div>

      {/* Desktop / Tablet */}
      <div className="hidden md:grid grid-cols-[2fr_1fr] gap-6">
        {/* Featured */}
        <AnimatePresence mode="wait">
          <motion.div
            key={featured.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <LandscapeCard
              {...featured}
              large
              showTitle
            />
          </motion.div>
        </AnimatePresence>

        {/* Side Queue */}
        <div className="flex flex-col h-full gap-4">
  {sideShows.map((show, idx) => (
    <motion.div
      key={show.id}
      className="flex-1 cursor-pointer"
      whileHover={{ scale: 1.02 }}
      onClick={() =>
        setActiveIndex((activeIndex + idx + 1) % tvShows.length)
      }
    >
      <LandscapeCard
        {...show}
        compact
        showTitle
      />
    </motion.div>
  ))}
</div>

      </div>

      {/* Mobile */}
<div className="md:hidden space-y-4">
  {/* Highlighted TV */}
  <LandscapeCard
    {...featured}
    showTitle
  />

  {/* Next 3 */}
  {sideShows.map((show) => (
    <LandscapeCard
      key={show.id}
      {...show}
      compact
      showTitle
    />
  ))}
</div>

    </section>
  );
}

export default TVSection;

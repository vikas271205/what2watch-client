import { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import genreMap from "../utils/GenreMap";
import API_BASE from "../utils/api";
import { useLoading } from "../context/LoadingContext";
import ShimmerListGrid from "../components/ShimmerListGrid";
import { motion } from "framer-motion";

const timeFilters = {
  day: "Trending Today",
  week: "Trending This Week",
  month: "Trending This Month",
};

function Trending() {
  const [content, setContent] = useState([]);
  const [filter, setFilter] = useState("day");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);
  const { setIsLoading } = useLoading();

  useEffect(() => {
    setContent([]);
    setPage(1);
    setHasMore(true);
  }, [filter]);

  useEffect(() => {
    const fetchTrending = async () => {
      if (!hasMore) return;
      const isFirstPage = page === 1;
      isFirstPage ? setIsLoading(true) : setLocalLoading(true);

      try {
        const url =
          filter === "month"
            ? `${API_BASE}/api/tmdb/discover?page=${page}`
            : `${API_BASE}/api/tmdb/trending?time=${filter}&page=${page}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        if (!data || data.length === 0) {
          setHasMore(false);
          return;
        }

        setContent((prev) => [...prev, ...data.slice(0, 10).filter(item => item.poster_path).map(item => ({
          id: item.id,
          title: item.title || item.name,
          imageUrl: `https://image.tmdb.org/t/p/w300${item.poster_path}`,
          tmdbRating: item.vote_average?.toString(),
          language: item.original_language,
          genres: (item.genre_ids || []).map(id => genreMap[id] || ""),
          isTV: !!item.name,
        }))]);
        if (data.length < 10) setHasMore(false);
      } catch (err) {
        console.error("Failed to fetch trending content:", err);
      } finally {
        setIsLoading(false);
        setLocalLoading(false);
      }
    };

    fetchTrending();
  }, [page, filter, setIsLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white px-4 sm:px-6 py-6">
      <motion.h1
        className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sticky top-0 bg-gray-900/80 backdrop-blur-sm z-10 py-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        🔥 Trending Content
      </motion.h1>

      <div className="flex flex-wrap gap-2 mb-6 sticky top-12 bg-gray-900/80 backdrop-blur-sm z-10 py-2">
        {Object.entries(timeFilters).map(([key, label]) => (
          <motion.button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-sm sm:text-base font-semibold transition ${
              key === filter ? "bg-indigo-600" : "bg-gray-800 hover:bg-gray-700"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Filter by ${label}`}
          >
            {label}
          </motion.button>
        ))}
      </div>

      {page === 1 && content.length === 0 ? (
        <ShimmerListGrid count={10} />
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {content.map((item) => (
            <MovieCard
              key={`${item.id}_${item.isTV}`}
              id={item.id}
              title={item.title}
              imageUrl={item.imageUrl}
              tmdbRating={item.tmdbRating}
              genres={item.genres}
              isTV={item.isTV}
              language={item.language}
            />
          ))}
        </motion.div>
      )}

      {hasMore && !localLoading && (
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.button
            onClick={() => setPage((prev) => prev + 1)}
            className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-indigo-600 text-sm sm:text-base font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Load more content"
          >
            Load More
          </motion.button>
        </motion.div>
      )}

      {localLoading && (
        <p className="text-gray-400 text-center mt-6 text-sm sm:text-base">Loading more...</p>
      )}

      {!hasMore && !localLoading && (
        <p className="text-gray-500 text-center mt-6 text-sm sm:text-base">You have reached the end.</p>
      )}
    </div>
  );
}

export default Trending;
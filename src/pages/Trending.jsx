import { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import genreMap from "../utils/GenreMap";
import API_BASE from "../utils/api";
import { useLoading } from "../context/LoadingContext";
import ShimmerListGrid from "../components/ShimmerListGrid";
import { motion } from "framer-motion";
import { fetchOMDbData } from "../api/omdb"; 
import { calculateUncleScore } from "../utils/uncleScore";

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
  const [backdropImage, setBackdropImage] = useState(null);

  useEffect(() => {
    setContent([]); setPage(1); setHasMore(true); setBackdropImage(null);
  }, [filter]);

  useEffect(() => {
    const fetchTrending = async () => {
      if (!hasMore && page !== 1) return;
      const isFirstPage = page === 1;
      isFirstPage ? setIsLoading(true) : setLocalLoading(true);

      try {
        const url = filter === "month" ? `${API_BASE}/api/tmdb/discover?page=${page}` : `${API_BASE}/api/tmdb/trending?time=${filter}&page=${page}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const initialData = await res.json();

        if (!initialData || initialData.length === 0) { setHasMore(false); return; }

        // We still fetch extra data to calculate and DISPLAY the full Uncle Score
        const detailedDataPromises = initialData.map(async (item) => {
          const year = item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4);
          const omdbData = await fetchOMDbData(item.title || item.name, year);
          
          const uncleScore = calculateUncleScore(
            item.vote_average,
            omdbData?.imdbRating,
            omdbData?.Ratings?.find(r => r.Source === "Rotten Tomatoes")?.Value
          );
          return { ...item, ...omdbData, uncleScore };
        });

        const combinedData = await Promise.all(detailedDataPromises);

        // --- THE SORTING LOGIC IS NOW REMOVED ---
        // const sortedData = combinedData.sort((a, b) => (b.uncleScore || 0) - (a.uncleScore || 0));
        
        if (page === 1 && combinedData[0]?.backdrop_path) {
          setBackdropImage(`https://image.tmdb.org/t/p/original${combinedData[0].backdrop_path}`);
        }
        
        // We map from combinedData, which preserves the original API order
const finalContent = combinedData
  .filter(item => item.poster_path)
  .map(item => {
    // Ensure safe numeric score
    const rawScore = item.uncleScore?.score;
    const safeScore = Number(rawScore);
    const finalScore = isNaN(safeScore) ? null : safeScore;

    return {
      id: item.id,
      title: item.title || item.name,
      imageUrl: `https://image.tmdb.org/t/p/w300${item.poster_path}`,
      tmdbRating: item.vote_average?.toString(),
      imdbRating: item.imdbRating,
      rtRating: item.Ratings?.find(r => r.Source === "Rotten Tomatoes")?.Value,
      language: item.original_language,
      genres: (item.genre_ids || []).map(id => genreMap[id] || ""),
      isTV: !!item.name,
      year: item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4),

      // WORTH IT SYSTEM — SAFE ALWAYS
      uncleScore: finalScore,
      uncleBadge: item.uncleScore?.badge ?? null,
    };
  });

        
        setContent((prev) => [...prev, ...finalContent]);
        
        if (initialData.length < 20) { setHasMore(false); }
      } catch (err) { console.error("Failed to fetch trending content:", err); } finally { setIsLoading(false); setLocalLoading(false); }
    };
    fetchTrending();
  }, [page, filter, setIsLoading]);

  return (
    <div className="relative min-h-screen bg-white text-black dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-gray-800 dark:text-white transition-colors duration-300">
      {backdropImage && (
        <>
          <div className="fixed inset-0 w-full h-full bg-cover bg-center filter blur-lg scale-110 z-0" style={{ backgroundImage: `url(${backdropImage})` }} />
          <div className="fixed inset-0 w-full h-full bg-black/60 z-0" />
        </>
      )}
      <div className="relative z-10 px-4 sm:px-6 py-6">
        <div className="sm:sticky top-0 z-30 mb-6">
          <motion.h1 className="text-xl sm:text-2sxl md:text-3xl font-bold pt-2 pb-4 text-white drop-shadow-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            🔥 Trending Content
          </motion.h1>
          <div className="flex flex-wrap gap-2 pb-2">
            {Object.entries(timeFilters).map(([key, label]) => (
              <motion.button key={key} onClick={() => setFilter(key)} className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-sm sm:text-base font-semibold transition ${key === filter ? "bg-indigo-600 text-white shadow-lg" : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm ring-1 ring-inset ring-white/20"}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} aria-label={`Filter by ${label}`}>
                {label}
              </motion.button>
            ))}
          </div>
        </div>
        {page === 1 && content.length === 0 ? <ShimmerListGrid count={20} /> : (
          <motion.div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            {content.map((item) => (
              <MovieCard key={`${item.id}_${item.isTV}`} {...item} />
            ))}
          </motion.div>
        )}
        {hasMore && !localLoading && <motion.div className="text-center mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}><motion.button onClick={() => setPage((prev) => prev + 1)} className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-indigo-600 text-sm sm:text-base font-semibold text-white" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} aria-label="Load more content">Load More</motion.button></motion.div>}
        {localLoading && <p className="text-center mt-6">Loading more...</p>}
        {!hasMore && !localLoading && <p className="text-center mt-6">You have reached the end.</p>}
      </div>
    </div>
  );
}

export default Trending;
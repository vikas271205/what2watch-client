import { useEffect, useState, useRef } from "react";
import MovieCard from "./MovieCard";
import API_BASE from "../utils/api";
import { fetchOMDbData } from "../api/omdb";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import ShimmerCard from "./ShimmerCard";

function TrendingSection() {
  const [movies, setMovies] = useState([]);
  const scrollRef = useRef();
  const [isSectionLoading, setIsSectionLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      setIsSectionLoading(true);
      try {
        const [res1, res2] = await Promise.all([
          fetch(`${API_BASE}/api/tmdb/trending?time=day&page=1`),
          fetch(`${API_BASE}/api/tmdb/trending?time=day&page=2`)
        ]);

        const data1 = await res1.json();
        const data2 = await res2.json();
        
        const combinedData = [];
        if (Array.isArray(data1)) combinedData.push(...data1);
        if (Array.isArray(data2)) combinedData.push(...data2);

        if (combinedData.length === 0) {
          setMovies([]);
          return;
        }

        const genreRes = await fetch(`${API_BASE}/api/tmdb/genres`);
        const genreData = await genreRes.json();
        const genreMap = {};
        if (Array.isArray(genreData)) {
          genreData.forEach((g) => { genreMap[g.id] = g.name; });
        }

        // --- 1. Sliced to get exactly 10 movies for the "Top 10" ---
        const filtered = combinedData
          .filter((m) => m.media_type === "movie" && m.poster_path)
          .slice(0, 10);
        
        const enriched = await Promise.all(
          filtered.map(async (movie) => {
            const omdbData = await fetchOMDbData(movie.title, movie.release_date?.slice(0, 4));
            return {
              id: movie.id, title: movie.title, year: movie.release_date?.slice(0, 4),
              imageUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
              tmdbRating: movie.vote_average?.toString(),
              imdbRating: omdbData?.imdbRating,
              rtRating: omdbData?.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value,
              genres: movie.genre_ids.map((id) => genreMap[id]).filter(Boolean),
              //popularity: movie.popularity || 0,
              //voteCount: movie.vote_count || 0,
            };
          })
        );
        setMovies(enriched);
      } catch (err) {
        console.error("Failed to fetch trending movies:", err);
        setMovies([]);
      } finally {
        setIsSectionLoading(false);
      }
    };
    fetchTrending();
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
          <TrendingUp className="text-gray-700 dark:text-indigo-400" size={28} />
          {/* --- 2. Title updated --- */}
          <h2 className="text-2xl font-bold text-gray-800 dark:bg-gradient-to-r dark:from-indigo-400 dark:to-purple-500 dark:bg-clip-text dark:text-transparent">
            Top 10 Movies Today
          </h2>
        </div>
        <Link 
          to="/trending" 
          className="text-xs font-semibold bg-gray-100 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
          See All
        </Link>
      </div>

      {isSectionLoading ? (
        <div className="grid grid-flow-col auto-cols-[calc(100%/2.2)] sm:auto-cols-[calc(100%/3.2)] lg:auto-cols-[calc(100%/5.2)] gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => <ShimmerCard key={i} />)}
        </div>
      ) : movies.length > 0 ? (
        <div className="relative">
          {/* --- 3. Clean carousel layout without numbers --- */}
          <div ref={scrollRef} className="grid grid-flow-col auto-cols-[calc(100%/2.2)] sm:auto-cols-[calc(100%/3.2)] lg:auto-cols-[calc(100%/5.2)] gap-4 overflow-x-auto no-scrollbar py-4 scroll-smooth">
            {movies.map((movie) => (
              <MovieCard key={movie.id} {...movie} />
            ))}
          </div>
          <button onClick={() => scroll('left')} className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-4 bg-white/80 dark:bg-white/10 backdrop-blur-sm p-2 rounded-full text-gray-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white dark:hover:bg-white/20 z-30 shadow-md" aria-label="Scroll left">
            <ChevronLeft size={24} />
          </button>
          <button onClick={() => scroll('right')} className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4 bg-white/80 dark:bg-white/10 backdrop-blur-sm p-2 rounded-full text-gray-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white dark:hover:bg-white/20 z-30 shadow-md" aria-label="Scroll right">
            <ChevronRight size={24} />
          </button>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No trending movies found at the moment.</p>
      )}
    </div>
  );
}

export default TrendingSection;
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
  <section className="relative group">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <TrendingUp
          className="text-indigo-500 dark:text-indigo-400"
          size={30}
        />
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Top 10 Movies Today
        </h2>
      </div>

      <Link
        to="/trending"
        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        See all
      </Link>
    </div>

    {/* Content */}
    {isSectionLoading ? (
      <div className="grid grid-flow-col auto-cols-[70%] sm:auto-cols-[40%] lg:auto-cols-[22%] gap-6 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <ShimmerCard key={i} />
        ))}
      </div>
    ) : movies.length > 0 ? (
      <div className="relative">
        <div
          ref={scrollRef}
          className="grid grid-flow-col auto-cols-[70%] sm:auto-cols-[40%] lg:auto-cols-[22%]
                     gap-6 overflow-x-auto no-scrollbar py-6 scroll-smooth"
        >
          {movies.map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>

        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-6
                     bg-black/70 backdrop-blur-md p-3 rounded-full text-white
                     opacity-0 group-hover:opacity-100 transition-all duration-300
                     hover:bg-black z-30"
          aria-label="Scroll left"
        >
          <ChevronLeft size={26} />
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-6
                     bg-black/70 backdrop-blur-md p-3 rounded-full text-white
                     opacity-0 group-hover:opacity-100 transition-all duration-300
                     hover:bg-black z-30"
          aria-label="Scroll right"
        >
          <ChevronRight size={26} />
        </button>
      </div>
    ) : (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No trending movies found at the moment.
      </p>
    )}
  </section>
);

}

export default TrendingSection;
import { useEffect, useState, useRef } from "react";
import MovieCard from "./MovieCard";
import API_BASE from "../utils/api";
import { fetchOMDbData } from "../api/omdb";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";

function BollywoodSection() {
  const [movies, setMovies] = useState([]);
  const scrollRef = useRef();
  const [isSectionLoading, setIsSectionLoading] = useState(true);
  
  useEffect(() => {
    setIsSectionLoading(true);
    const fetchBollywoodMovies = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/discover/bollywood`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        if (!Array.isArray(data)) {
            console.error("Bollywood API did not return an array:", data);
            setMovies([]);
            return;
        }

        const filtered = data.filter((item) => item.poster_path).slice(0, 15);

        const enriched = await Promise.all(
          filtered.map(async (movie) => {
            const omdbData = await fetchOMDbData(movie.title, movie.release_date?.slice(0, 4));
            return {
              id: movie.id,
              title: movie.title,
              year: movie.release_date?.slice(0, 4),
              imageUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
              genres: movie.genre_ids.map(id => {
                const genreMatch = movie.genres?.find(g => g.id === id);
                return genreMatch ? genreMatch.name : "";
              }).filter(Boolean),
              isTV: false,
              tmdbRating: movie.vote_average?.toString(),
              imdbRating: omdbData?.imdbRating,
              rtRating: omdbData?.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value,
            };
          })
        );
        setMovies(enriched);
      } catch (err) {
        console.error("Failed to fetch Bollywood movies:", err);
        setMovies([]);
      } finally {
        setIsSectionLoading(false);
      }
    };
    fetchBollywoodMovies();
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
          <Film className="text-gray-700 dark:text-indigo-400" size={28} />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Popular Bollywood Movies
          </h2>
        </div>
        <Link to="/bollywood" className="text-xs font-semibold bg-gray-100 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
          See All
        </Link>
      </div>
      
      {isSectionLoading ? (
        <div className="grid grid-flow-col auto-cols-[calc(100%/2.2)] sm:auto-cols-[calc(100%/3.2)] lg:auto-cols-[calc(100%/5.2)] gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => <div key={i} className="aspect-[2/3] bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : movies.length > 0 ? (
        <div className="relative">
          <div ref={scrollRef} className="grid grid-flow-col auto-cols-[calc(100%/2.2)] sm:auto-cols-[calc(100%/3.2)] lg:auto-cols-[calc(100%/5.2)] gap-4 overflow-x-auto no-scrollbar py-4 scroll-smooth">
            {movies.map((movie) => <MovieCard key={movie.id} {...movie} />)}
          </div>
          <button onClick={() => scroll('left')} className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-4 bg-white/80 dark:bg-white/10 backdrop-blur-sm p-2 rounded-full text-gray-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white dark:hover:bg-white/20 z-10 shadow-md" aria-label="Scroll left">
            <ChevronLeft size={24} />
          </button>
          <button onClick={() => scroll('right')} className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4 bg-white/80 dark:bg-white/10 backdrop-blur-sm p-2 rounded-full text-gray-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white dark:hover:bg-white/20 z-10 shadow-md" aria-label="Scroll right">
            <ChevronRight size={24} />
          </button>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No Bollywood movies found.</p>
      )}
    </div>
  );
}

export default BollywoodSection;
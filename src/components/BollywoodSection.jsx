import { useEffect, useState, useRef } from "react";
import MovieCard from "./MovieCard";
import genreMap from "../utils/GenreMap";
import API_BASE from "../utils/api"; // adjust path if needed


function BollywoodSection() {
  const [movies, setMovies] = useState([]);
  const scrollRef = useRef();

  useEffect(() => {
    const fetchBollywoodMovies = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/discover/bollywood`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        const filtered = data
          .filter((item) => item.poster_path)
          .sort(() => 0.5 - Math.random())
          .slice(0, 15);

        const formatted = filtered.map((movie) => ({
          ...movie,
          genre_names: movie.genre_ids.map((id) => genreMap[id] || "Unknown"),
        }));

        setMovies(formatted);
      } catch (err) {
        console.error("Failed to fetch Bollywood movies:", err);
        setMovies([]);
      }
    };

    fetchBollywoodMovies();
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animationId;

    const scroll = () => {
      if (container.scrollLeft >= container.scrollWidth / 2) {
        container.scrollLeft = 0;
      } else {
        container.scrollLeft += 1.0;
      }
      animationId = requestAnimationFrame(scroll);
    };

    const pause = () => cancelAnimationFrame(animationId);
    const resume = () => scroll();

    container.addEventListener("mouseenter", pause);
    container.addEventListener("mouseleave", resume);

    scroll();

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener("mouseenter", pause);
      container.removeEventListener("mouseleave", resume);
    };
  }, [movies]);

  return (
    <div className="mb-6 sm:mb-10">
      <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">🇮🇳 Popular Bollywood Movies</h2>

      {movies.length === 0 ? (
        <p className="text-gray-400 text-sm">No Bollywood movies found.</p>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-1 sm:pb-2"
        >
          {[...movies, ...movies].map((movie, index) => (
            <MovieCard
              key={`${movie.id}_${index}`}
              id={movie.id}
              title={movie.title}
              imageUrl={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
              publicRating={movie.vote_average}
              size="small"
              genres={movie.genre_names}
              isTV={false}
              language={movie.original_language}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default BollywoodSection;
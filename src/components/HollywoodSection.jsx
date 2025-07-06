import { useEffect, useState, useRef } from "react";
import MovieCard from "./MovieCard";
import genreMap from "../utils/GenreMap";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "";

function HollywoodSection() {
  const [movies, setMovies] = useState([]);
  const scrollRef = useRef();

  useEffect(() => {
    const fetchHollywood = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/discover/hollywood`);
        const data = await res.json();

        const selected = data
          .filter((movie) => movie.poster_path)
          .sort(() => 0.5 - Math.random())
          .slice(0, 15)
          .map((movie) => ({
            ...movie,
            genre_names: movie.genre_ids.map((id) => genreMap[id]).filter(Boolean),
          }));

        setMovies(selected);
      } catch (err) {
        console.error("Failed to fetch Hollywood movies:", err);
      }
    };

    fetchHollywood();
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animationId;

    const scroll = () => {
      if (container.scrollLeft >= container.scrollWidth / 2) {
        container.scrollLeft = 0;
      } else {
        container.scrollLeft += 1;
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
    <div className="mb-10">
      <h2 className="text-2xl font-bold mb-4">🎬 Hollywood Movies</h2>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar pb-2"
      >
        {[...movies, ...movies].map((movie, index) => (
          <MovieCard
            key={`${movie.id}_${index}`}
            id={movie.id}
            title={movie.title}
            imageUrl={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
            publicRating={movie.vote_average}
            genres={movie.genre_names}
            language={movie.original_language}
            size="small"
          />
        ))}
      </div>
    </div>
  );
}

export default HollywoodSection;

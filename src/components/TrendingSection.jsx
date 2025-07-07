import { useEffect, useState, useRef } from "react";
import MovieCard from "./MovieCard";
import API_BASE from "../utils/api"; // adjust path if needed
import { useLoading } from "../context/LoadingContext";


function TrendingSection() {
  const [movies, setMovies] = useState([]);
  const [genreMap, setGenreMap] = useState({});
  const scrollRef = useRef();
  const { setIsLoading } = useLoading();

  // 🔹 Fetch genre map from backend
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/genres`);
        const data = await res.json();
        const map = {};
        data.forEach((g) => {
          map[g.id] = g.name;
        });
        setGenreMap(map);
      } catch (err) {
        console.error("Failed to fetch genres:", err);
      }
    };

    fetchGenres();
  }, []);

  // 🔹 Fetch trending movies
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/api/tmdb/trending?time=week`);
        const data = await res.json();

        const filtered = data
          .filter((m) => m.media_type === "movie" && m.poster_path)
          .sort(() => 0.5 - Math.random())
          .slice(0, 15);

        const enriched = filtered.map((movie) => ({
          id: movie.id,
          title: movie.title,
          imageUrl: `https://image.tmdb.org/t/p/w300${movie.poster_path}`,
          publicRating: movie.vote_average,
          language: movie.original_language,
          genres: movie.genre_ids.map((id) => genreMap[id]).filter(Boolean),
        }));

        setMovies(enriched);
      } catch (err) {
        console.error("Failed to fetch trending movies:", err);
        setMovies([]);
      }finally {
    setIsLoading(false); // ✅ Add this line
  }
    };

    if (Object.keys(genreMap).length > 0) {
      fetchTrending();
    }
  }, [genreMap]);

  // 🔄 Auto-scroll animation
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
    <div className="mb-10">
      <h2 className="text-2xl font-bold mb-4">🔥 Trending Movies This Week</h2>

      {movies.length === 0 ? (
        <p className="text-gray-400 text-sm">No trending movies found.</p>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar pb-2"
        >
          {[...movies, ...movies].map((movie, index) => (
            <MovieCard
              key={`${movie.id}_${index}`}
              id={movie.id}
              title={movie.title}
              imageUrl={movie.imageUrl}
              publicRating={movie.publicRating}
              language={movie.language}
              genres={movie.genres}
              size="small"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TrendingSection;

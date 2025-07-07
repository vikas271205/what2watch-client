import { useEffect, useState, useRef } from "react";
import MovieCard from "./MovieCard";
import API_BASE from "../utils/api";
import { useLoading } from "../context/LoadingContext";
import { fetchOMDbData } from "../api/omdb";

function TrendingSection() {
  const [movies, setMovies] = useState([]);
  const [genreMap, setGenreMap] = useState({});
  const scrollRef = useRef();
  const { setIsLoading } = useLoading();

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

  useEffect(() => {
    const fetchTrending = async () => {
      if (Object.keys(genreMap).length === 0) return;
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/api/tmdb/trending?time=week`);
        const data = await res.json();

        const filtered = data
          .filter((m) => m.media_type === "movie" && m.poster_path)
          .sort(() => 0.5 - Math.random())
          .slice(0, 15);

        const enriched = await Promise.all(
          filtered.map(async (movie) => {
            const omdbData = await fetchOMDbData(movie.title, movie.release_date?.slice(0, 4));
            return {
              id: movie.id,
              title: movie.title,
              imageUrl: `https://image.tmdb.org/t/p/w300${movie.poster_path}`,
              tmdbRating: movie.vote_average?.toString(),
              imdbRating: omdbData?.imdbRating,
              rtRating: omdbData?.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value,
              language: movie.original_language,
              genres: movie.genre_ids.map((id) => genreMap[id]).filter(Boolean),
            };
          })
        );

        setMovies(enriched);
      } catch (err) {
        console.error("Failed to fetch trending movies:", err);
        setMovies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrending();
  }, [genreMap, setIsLoading]);

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
              tmdbRating={movie.tmdbRating}
              imdbRating={movie.imdbRating}
              rtRating={movie.rtRating}
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
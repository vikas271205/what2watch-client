import { useEffect, useState, useRef } from "react";
import MovieCard from "./MovieCard";
import API_BASE from "../utils/api";
import { fetchOMDbData } from "../api/omdb";
import { ChevronLeft, ChevronRight, MonitorPlay } from "lucide-react";
import genreMap from "../utils/GenreMap";

export default function NowPlayingIndiaSection() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef();

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const res = await fetch(`${API_BASE}/api/tmdb/now_playing/in`);
        const data = await res.json();

        const filtered = data
          .filter((m) => m.poster_path)
          .slice(0, 12);

        const enriched = await Promise.all(
          filtered.map(async (movie) => {
            const year = movie.release_date?.slice(0, 4);
            const omdb = await fetchOMDbData(movie.title, year);

            // --- Extract clean ratings (NO scoring logic here) ---
            const imdbRating =
              omdb?.Ratings?.find((r) => r.Source === "Internet Movie Database")
                ?.Value?.split("/")[0] || null;

            const rtRating =
              omdb?.Ratings?.find((r) => r.Source === "Rotten Tomatoes")
                ?.Value || null;

            return {
              id: movie.id,
              title: movie.title,
              year,
              imageUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,

              // Raw rating inputs for Uncle Score Engine
              tmdbRating: movie.vote_average,
              imdbRating,
              rtRating,

              popularity: movie.popularity,
              voteCount: movie.vote_count,
              genres: movie.genre_ids.map((gid) => genreMap[gid]).filter(Boolean),

              isTV: false
            };
          })
        );

        setMovies(enriched);
      } catch (err) {
        console.error("Failed to fetch Now Playing India:", err);
      }

      setLoading(false);
    };

    load();
  }, []);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amt = el.offsetWidth;
    el.scrollBy({
      left: direction === "left" ? -amt : amt,
      behavior: "smooth"
    });
  };

  return (
    <div className="relative group mt-10">
      <div className="flex items-center gap-3 mb-4">
        <MonitorPlay className="text-red-500" size={26} />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Now Playing in India
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-flow-col auto-cols-[calc(100%/2.4)] sm:auto-cols-[calc(100%/3.4)] lg:auto-cols-[calc(100%/5.4)] gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="relative">
          <div
            ref={scrollRef}
            className="grid grid-flow-col auto-cols-[calc(100%/2.4)] sm:auto-cols-[calc(100%/3.4)] lg:auto-cols-[calc(100%/5.4)] gap-4 overflow-x-auto no-scrollbar py-4"
          >
            {movies.map((m) => (
              <MovieCard key={m.id} {...m} />
            ))}
          </div>

          <button
            onClick={() => scroll("left")}
            className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-4 bg-white/80 dark:bg-white/10 p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={() => scroll("right")}
            className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4 bg-white/80 dark:bg-white/10 p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

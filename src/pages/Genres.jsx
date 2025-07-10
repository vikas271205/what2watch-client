import { useState, useEffect } from "react";
import MovieCard from "../components/MovieCard";
import ShimmerCard from "../components/ShimmerCard";
import { useLoading } from "../context/LoadingContext";
import API_BASE from "../utils/api";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

function Genres() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const genreFromUrl = params.get("genre");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const { setIsLoading } = useLoading();

  useEffect(() => {
    const fetchGenres = async () => {
      const cachedGenres = localStorage.getItem("tmdb_genres");
      let data = [];

      if (cachedGenres) {
        data = JSON.parse(cachedGenres);
        setGenres(data);
      } else {
        try {
          setIsLoading(true);
          const res = await fetch(`${API_BASE}/api/tmdb/genres`);
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          data = await res.json();
          setGenres(data);
          localStorage.setItem("tmdb_genres", JSON.stringify(data));
        } catch (e) {
          console.error("Failed to fetch genres", e);
        } finally {
          setIsLoading(false);
        }
      }

      if (genreFromUrl) {
        const found = data.find(
          (g) => g.name.toLowerCase() === genreFromUrl.toLowerCase()
        );
        setSelectedGenre(found || data[0]);
      } else {
        setSelectedGenre(data[0]);
      }
    };

    fetchGenres();
  }, [genreFromUrl, setIsLoading]);

  // Fetch movies
  const fetchMoviesByGenre = async (reset = false) => {
    if (!selectedGenre) return;
    try {
      setLoadingLocal(true);
      const pageToFetch = reset ? 1 : page;

      const res = await fetch(
        `${API_BASE}/api/tmdb/byGenre?genreId=${selectedGenre.id}&page=${pageToFetch}`
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      let filtered = data.filter(
        (movie) => movie.adult === false && movie.poster_path
      );

      if (selectedGenre.name.toLowerCase() === "romance") {
        filtered = filtered.filter((m) => m.original_language !== "ja");
      }

      const transformed = filtered.map((movie) => ({
        ...movie,
        tmdbRating: movie.vote_average?.toString(),
        language: movie.original_language,
        genres: movie.genre_ids?.map(
          (id) => genres.find((g) => g.id === id)?.name || ""
        ),
      }));

      if (reset) {
        setMovies(transformed);
      } else {
        setMovies((prev) => [...prev, ...transformed]);
      }

      setHasMore(filtered.length >= 10);
    } catch (e) {
      console.error("Failed to fetch genre movies", e);
      if (reset) setMovies([]);
    } finally {
      setLoadingLocal(false);
    }
  };

  // Fetch when genre or page changes
  useEffect(() => {
    if (selectedGenre) {
      fetchMoviesByGenre(page === 1); // true = reset
    }
  }, [selectedGenre, page]);

  return (
    <main className="min-h-screen">
      <motion.h1
        className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 py-2 text-black dark:text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        🎭 Browse by Genre
      </motion.h1>

      <div className="flex flex-wrap gap-2 mb-6 py-2">
        {genres.map((genre) => (
          <motion.button
            key={genre.id}
            onClick={() => {
              setSelectedGenre(genre);
              setPage(1);
              setMovies([]);
            }}
            className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-sm sm:text-base font-semibold transition ${
              selectedGenre?.id === genre.id
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-black hover:bg-gray-300 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Select ${genre.name} genre`}
          >
            {genre.name}
          </motion.button>
        ))}
      </div>

      {selectedGenre && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4 text-indigo-400">
            🎬 {selectedGenre.name} Movies
          </h2>

          {loadingLocal ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {Array(10)
                .fill(0)
                .map((_, i) => (
                  <ShimmerCard key={i} />
                ))}
            </div>
          ) : movies.length === 0 ? (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              No movies found.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  id={movie.id}
                  title={movie.title}
                  imageUrl={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                  tmdbRating={movie.tmdbRating}
                  genres={movie.genres}
                  language={movie.language}
                />
              ))}
            </div>
          )}

          {hasMore && !loadingLocal && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setPage((prev) => prev + 1)}
                className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg"
              >
                Load More
              </button>
            </div>
          )}
        </motion.section>
      )}
    </main>
  );
}

export default Genres;

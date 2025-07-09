import { useState, useEffect } from "react";
import MovieCard from "../components/MovieCard";
import { useLoading } from "../context/LoadingContext";
import API_BASE from "../utils/api";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

function Genres() {
  const location = useLocation(); // ✅ move this to top level
  const params = new URLSearchParams(location.search);
  const genreFromUrl = params.get("genre"); // like "Action"

  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [movies, setMovies] = useState([]);
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

      // ✅ Set selected genre from URL
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

  useEffect(() => {
    const fetchMoviesByGenre = async () => {
      if (!selectedGenre) return;

      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/api/tmdb/byGenre?genreId=${selectedGenre.id}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        let filteredMovies = data.filter(
          (movie) => movie.adult === false && movie.poster_path
        );

        if (selectedGenre.name.toLowerCase() === "romance") {
          filteredMovies = filteredMovies.filter(
            (movie) => movie.original_language !== "ja"
          );
        }

        setMovies(filteredMovies.slice(0, 10).map(movie => ({
          ...movie,
          tmdbRating: movie.vote_average?.toString(),
          language: movie.original_language,
          genres: movie.genre_ids?.map(id => genres.find(g => g.id === id)?.name || ""),
        })));
      } catch (e) {
        console.error("Failed to fetch genre movies", e);
        setMovies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMoviesByGenre();
  }, [selectedGenre, genres, setIsLoading]);

  return (
    <main className="min-h-screen">
      <motion.h1
        className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 py-2 text-black dark:text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        🎭 Browse by Genre
      </motion.h1>

      <div className="flex flex-wrap gap-2 mb-6 sticky top-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 py-2">
        {genres.map((genre) => (
          <motion.button
            key={genre.id}
            onClick={() => setSelectedGenre(genre)}
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
          {movies.length === 0 ? (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">No movies found.</p>
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
                  language={movie.original_language}
                />
              ))}
            </div>
          )}
        </motion.section>
      )}
    </main>
  );
}

export default Genres;

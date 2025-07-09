import { useState, useEffect } from "react";
import MovieCard from "../components/MovieCard";
import { useLoading } from "../context/LoadingContext";
import API_BASE from "../utils/api";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

function TVShows() {
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [shows, setShows] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);
  const { setIsLoading } = useLoading();

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const genreParam = queryParams.get("genre");

  useEffect(() => {
    const fetchGenres = async () => {
      const cachedGenres = localStorage.getItem("tmdb_tv_genres");
      let genresArray = [];

      if (cachedGenres) {
        const data = JSON.parse(cachedGenres);
        genresArray = data.genres || data;
        setGenres(genresArray);
      } else {
        try {
          setIsLoading(true);
          const res = await fetch(`${API_BASE}/api/tmdb/genre/tv`);
          const data = await res.json();
          genresArray = data.genres || data;
          localStorage.setItem("tmdb_tv_genres", JSON.stringify(data));
          setGenres(genresArray);
        } catch (e) {
          console.error("Failed to fetch TV genres", e);
          setGenres([]);
        } finally {
          setIsLoading(false);
        }
      }

      // Match genre from URL
      if (genreParam) {
        const match = genresArray.find(
          (g) => g.name.toLowerCase() === genreParam.toLowerCase()
        );
        if (match) setSelectedGenre(match);
        else setSelectedGenre(genresArray[0]);
      } else {
        setSelectedGenre(genresArray[0]);
      }
    };

    fetchGenres();
  }, [genreParam, setIsLoading]);

  useEffect(() => {
    const fetchShowsByGenre = async () => {
      if (!selectedGenre || !hasMore) return;

      try {
        const isFirstPage = page === 1;
        isFirstPage ? setIsLoading(true) : setLocalLoading(true);
        const res = await fetch(
          `${API_BASE}/api/tmdb/discover/tv?with_genres=${selectedGenre.id}&page=${page}`
        );
        const data = await res.json();

        const filteredShows = data.results.filter(
          (show) => show.adult === false && show.poster_path
        );

        setShows((prev) => [
          ...prev,
          ...filteredShows.slice(0, 10).map((show) => ({
            ...show,
            tmdbRating: show.vote_average?.toString(),
            language: show.original_language,
            genres: show.genre_ids?.map(
              (id) => genres.find((g) => g.id === id)?.name || ""
            ),
          })),
        ]);

        if (filteredShows.length < 10) setHasMore(false);
      } catch (e) {
        console.error("Failed to fetch TV shows", e);
        setShows([]);
      } finally {
        setIsLoading(false);
        setLocalLoading(false);
      }
    };

    fetchShowsByGenre();
  }, [selectedGenre, page, genres, hasMore, setIsLoading]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedGenre]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-900 dark:via-black dark:to-gray-800 text-black dark:text-white px-4 sm:px-6 py-6">
      <motion.h1
        className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 py-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        📺 TV Shows
      </motion.h1>

      <div className="flex flex-wrap gap-2 mb-6 sticky top-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 py-2">
        {genres.map((genre) => (
          <motion.button
            key={genre.id}
            onClick={() => {
              setSelectedGenre(genre);
              setShows([]);
              setPage(1);
              setHasMore(true);
            }}
            className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-sm sm:text-base font-semibold transition ${
              selectedGenre?.id === genre.id
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
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
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4 text-indigo-600 dark:text-indigo-400">
            🎬 {selectedGenre.name} Shows
          </h2>

          {shows.length === 0 && !localLoading ? (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">No shows found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {shows.map((show) => (
                <MovieCard
                  key={show.id}
                  id={show.id}
                  title={show.name}
                  imageUrl={`https://image.tmdb.org/t/p/w300${show.poster_path}`}
                  tmdbRating={show.tmdbRating}
                  genres={show.genres}
                  language={show.original_language}
                  isTV={true}
                />
              ))}
            </div>
          )}
        </motion.section>
      )}

      {hasMore && !localLoading && (
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.button
            onClick={() => setPage((prev) => prev + 1)}
            className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-indigo-600 text-white text-sm sm:text-base font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Load more shows"
          >
            Load More
          </motion.button>
        </motion.div>
      )}

      {localLoading && (
        <p className="text-gray-600 dark:text-gray-400 text-center mt-6 text-sm sm:text-base">
          Loading more...
        </p>
      )}

      {!hasMore && !localLoading && (
        <p className="text-gray-700 dark:text-gray-500 text-center mt-6 text-sm sm:text-base">
          You have reached the end.
        </p>
      )}
    </div>
  );
}

export default TVShows;

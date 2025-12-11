import { useState, useEffect } from "react";
import MovieCard from "../components/MovieCard";
import ShimmerCard from "../components/ShimmerCard";
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

  const [languageFilter, setLanguageFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("default");
  const [yearFilter, setYearFilter] = useState("all");

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

      if (genreParam) {
        const match = genresArray.find(
          (g) => g.name.toLowerCase() === genreParam.toLowerCase()
        );
        setSelectedGenre(match || genresArray[0]);
      } else {
        setSelectedGenre(genresArray[0]);
      }
    };

    fetchGenres();
  }, [genreParam, setIsLoading]);

  const fetchShowsByGenre = async (reset = false) => {
    if (!selectedGenre) return;
    try {
      setLocalLoading(true);
      const pageToFetch = reset ? 1 : page;

      const queryParams = new URLSearchParams({
        with_genres: selectedGenre.id,
        page: pageToFetch,
      });
      if (languageFilter !== "all") queryParams.append("language", languageFilter);
      if (yearFilter !== "all") queryParams.append("year", yearFilter);

      const res = await fetch(`${API_BASE}/api/tmdb/discover/tv?${queryParams}`);
      const data = await res.json();

      let filtered = data.results.filter(
        (show) => show.adult === false && show.poster_path
      );

      if (selectedGenre.name.toLowerCase() === "animation") {
        filtered = filtered.filter((s) => s.genre_ids.includes(16));
      } else {
        filtered = filtered.filter((s) => !s.genre_ids.includes(16));
      }

const transformed = await Promise.all(
  filtered.map(async (show) => {
    const title = show.name;
    const year = show.first_air_date?.substring(0, 4);

    // --- Fetch IMDb & RT for accurate Uncle Score ---
    let imdbRating = null;
    let rtRating = null;

    try {
      const omdb = await fetch(
        `${API_BASE}/api/omdb?title=${encodeURIComponent(title)}&year=${year}`
      ).then((r) => r.json());

      imdbRating =
        omdb?.Ratings?.find((r) => r.Source === "Internet Movie Database")
          ?.Value?.split("/")[0] || null;

      rtRating =
        omdb?.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value ||
        null;
    } catch (err) {
      console.error("OMDb fetch failed:", err);
    }

    return {
      ...show,

      // Needed for MovieCard → Uncle Score Engine
      tmdbRating: show.vote_average,
      imdbRating,
      rtRating,
      popularity: show.popularity,
      voteCount: show.vote_count,
      year,

      language: show.original_language,
      genres: show.genre_ids?.map((id) => genres.find((g) => g.id === id)?.name || ""),
      isTV: true,
      imageUrl: `https://image.tmdb.org/t/p/w300${show.poster_path}`,
    };
  })
);


      let finalList = [...transformed];

      if (ratingFilter === "highest") {
        finalList.sort((a, b) => b.vote_average - a.vote_average);
      } else if (ratingFilter === "lowest") {
        finalList.sort((a, b) => a.vote_average - b.vote_average);
      }

      if (reset) {
        setShows(finalList);
      } else {
        setShows((prev) => [...prev, ...finalList]);
      }

      setHasMore(filtered.length >= 10);
    } catch (e) {
      console.error("Failed to fetch TV shows", e);
      if (reset) setShows([]);
    } finally {
      setLocalLoading(false);
    }
  };

  // 🔁 Fetch when filters or genre change
  useEffect(() => {
    if (selectedGenre) {
      setPage(1);
      setShows([]);
      fetchShowsByGenre(true);
    }
  }, [selectedGenre, languageFilter, yearFilter, ratingFilter]);

  // 🔁 Load more when page changes
  useEffect(() => {
    if (page > 1 && selectedGenre) {
      fetchShowsByGenre(false);
    }
  }, [page]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-900 dark:via-black dark:to-gray-800 text-black dark:text-white px-4 sm:px-6 py-6">
      <motion.h1
        className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 py-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        📺 TV Shows
      </motion.h1>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* 🌐 Language Filter */}
        <select
          className="px-3 py-1 rounded border bg-white dark:bg-gray-800 dark:text-white"
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
        >
          <option value="all">All Languages</option>
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="ko">Korean</option>
          <option value="ja">Japanese</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
        </select>

        {/* ⭐ Rating Filter */}
        <select
          className="px-3 py-1 rounded border bg-white dark:bg-gray-800 dark:text-white"
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
        >
          <option value="default">Default</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>

        {/* 📅 Year Filter */}
        <select
          className="px-3 py-1 rounded border bg-white dark:bg-gray-800 dark:text-white"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          <option value="all">All Years</option>
          {Array.from({ length: 12 }, (_, i) => 2024 - i).map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 py-2">
        {genres.map((genre) => (
          <motion.button
            key={genre.id}
            onClick={() => {
              setSelectedGenre(genre);
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

          {localLoading && shows.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {Array(10).fill(0).map((_, i) => <ShimmerCard key={i} />)}
            </div>
          ) : shows.length === 0 ? (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              No shows found.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {shows.map((show) => (
<MovieCard
  key={show.id}
  id={show.id}
  title={show.name}
  imageUrl={show.imageUrl}
  tmdbRating={show.tmdbRating}
  imdbRating={show.imdbRating}
  rtRating={show.rtRating}
  popularity={show.popularity}
  voteCount={show.voteCount}
  genres={show.genres}
  year={show.year}
  isTV={true}
/>

              ))}
            </div>
          )}
        </motion.section>
      )}

      {hasMore && !localLoading && (
        <div className="text-center mt-6">
          <button
            onClick={() => setPage((prev) => prev + 1)}
            className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg"
          >
            Load More
          </button>
        </div>
      )}

      {localLoading && shows.length > 0 && (
        <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
          Loading more...
        </div>
      )}

      {!hasMore && !localLoading && (
        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          You’ve reached the end.
        </p>
      )}
    </div>
  );
}

export default TVShows;

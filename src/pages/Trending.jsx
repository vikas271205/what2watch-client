// src/pages/Trending.jsx
import { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import genreMap from "../utils/GenreMap";

const timeFilters = {
  day: "Trending Today",
  week: "Trending This Week",
  month: "Trending This Month",
};

function Trending() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("day");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setContent([]);
    setPage(1);
    setHasMore(true);
  }, [filter]);

  useEffect(() => {
    const run = async () => {
      await fetchTrending();
    };
    run();
  }, [page, filter]);

  const fetchTrending = async () => {
    if (!hasMore) return;
    setLoading(true);

    try {
      const url =
        filter === "month"
          ? `/api/tmdb/discover?page=${page}`
          : `/api/tmdb/trending?time=${filter}&page=${page}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      const results = data.map((item) => {
        const title = item.title || item.name;
        const rating = typeof item.vote_average === "number" ? item.vote_average : 0;

        if (!title || !item.poster_path) return null;

        return {
          id: item.id,
          title,
          imageUrl: `https://image.tmdb.org/t/p/w300${item.poster_path}`,
          publicRating: rating,
          language: item.original_language,
          genres: (item.genre_ids || []).map((id) => genreMap[id] || ""),
          isTV: !!item.name,
        };
      });

      const filtered = results.filter(Boolean);

      setContent((prev) => [...prev, ...filtered]);
      if (filtered.length < 20) setHasMore(false);
    } catch (err) {
      console.error("Failed to fetch trending content:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black dark:bg-zinc-900 dark:text-white px-4 sm:px-6 md:px-10 py-6">
      <h1 className="text-3xl font-bold mb-4">🔥 Trending Content</h1>

      <div className="flex gap-2 mb-6">
        {Object.entries(timeFilters).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1 rounded-full text-sm transition font-semibold border ${
              key === filter ? "bg-blue-600 border-blue-700" : "border-gray-600 hover:bg-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {content.map((item) => (
          <MovieCard
            key={`${item.id}_${item.isTV}`}
            id={item.id}
            title={item.title}
            imageUrl={item.imageUrl}
            publicRating={item.publicRating}
            genres={item.genres}
            isTV={item.isTV}
            language={item.language}
          />
        ))}
      </div>

      {loading && <p className="text-gray-400 text-center mt-6">Loading...</p>}

      {hasMore && !loading && (
        <div className="text-center mt-6">
          <button
            onClick={() => setPage((prev) => prev + 1)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white font-semibold"
          >
            Load More
          </button>
        </div>
      )}

      {!hasMore && !loading && (
        <p className="text-center text-gray-500 mt-6">You have reached the end.</p>
      )}
    </div>
  );
}

export default Trending;
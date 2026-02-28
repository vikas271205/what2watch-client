// src/components/MoviesForYouSection.jsx
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { getWatchHistory } from "../utils/watchHistory";
import API_BASE from "../utils/api";
import MovieCard from "./MovieCard";

// IMPORTANT: must map genre name → TMDB genre ID
import genreMap from "../utils/GenreMap";

const CACHE_KEY_DATA = "moviesForYou_cache_data";
const CACHE_KEY_TIME = "moviesForYou_cache_time";
const CACHE_KEY_PROFILE = "moviesForYou_cache_profileHash";

const CACHE_DURATION = 24 * 60 * 60 * 1000;

export default function MoviesForYouSection({ maxItems = 20 }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const watchHistory = getWatchHistory();
  const scrollRef = useRef(null);

  // -------- Profile Hash --------
  const computeProfileHash = () => {
    if (!watchHistory || watchHistory.length === 0) return "no-history";
    const signature = watchHistory.map((entry) => ({
      id: entry.id,
      genres: entry.genres?.sort().join(",") || "",
      ts: entry.timestamp || 0,
    }));
    return JSON.stringify(signature);
  };

  const profileHash = computeProfileHash();

  // -------- Cache --------
  const loadFromCacheIfValid = () => {
    try {
      const cacheTime = localStorage.getItem(CACHE_KEY_TIME);
      const cacheProfile = localStorage.getItem(CACHE_KEY_PROFILE);
      const cacheData = localStorage.getItem(CACHE_KEY_DATA);

      if (!cacheTime || !cacheData) return null;

      const age = Date.now() - Number(cacheTime);
      if (age > CACHE_DURATION) return null;

      if (profileHash !== "no-history" && profileHash !== cacheProfile)
        return null;

      // 🔒 Safe parse check
      if (typeof cacheData !== "string" || cacheData.trim() === "")
        return null;

      try {
        const parsed = JSON.parse(cacheData);
        if (!Array.isArray(parsed)) return null;
        return parsed;
      } catch {
        // corrupted cache → clear it
        localStorage.removeItem(CACHE_KEY_DATA);
        localStorage.removeItem(CACHE_KEY_TIME);
        localStorage.removeItem(CACHE_KEY_PROFILE);
        return null;
      }
    } catch {
      return null;
    }
  };

  const saveToCache = (data) => {
    localStorage.setItem(CACHE_KEY_DATA, JSON.stringify(data));
    localStorage.setItem(CACHE_KEY_TIME, String(Date.now()));
    localStorage.setItem(CACHE_KEY_PROFILE, profileHash);
  };

  // -------- Genre Profile (Weighted + Recency) --------
  const buildGenreProfile = () => {
    const freq = {};
    const now = Date.now();

    watchHistory.forEach((entry) => {
      const hoursAgo =
        (now - (entry.timestamp || now)) / (1000 * 60 * 60);
      const recencyWeight = 1 / (hoursAgo + 5);

      (entry.genres || []).forEach((g) => {
        const gid = genreMap[g];
        if (!gid) return;
        freq[gid] = (freq[gid] || 0) + recencyWeight;
      });
    });

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([gid]) => Number(gid))
      .slice(0, 3);
  };

  // -------- Scoring --------
  const scoreItem = (item, userGenreIds) => {
    let score = 0;

    if (item.genre_ids) {
      item.genre_ids.forEach((gid) => {
        if (userGenreIds.includes(gid)) score += 6;
      });
    }

    if (item.vote_average) score += item.vote_average;
    if (item.popularity) score += item.popularity * 0.01;

    return score;
  };

  const shuffleArray = (array) =>
    array
      .map((x) => ({ x, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map((a) => a.x);

  // -------- Fetchers --------
  const fetchRandomMovies = async () => {
    const randomPage = Math.floor(Math.random() * 30) + 1;

    const res = await fetch(
      `${API_BASE}/api/tmdb/discover?page=${randomPage}`
    );

    if (!res.ok) return [];

    return await res.json(); // returns array directly
  };

  const fetchRandomTV = async () => {
    const randomPage = Math.floor(Math.random() * 30) + 1;

    const res = await fetch(
      `${API_BASE}/api/tmdb/discover/tv?page=${randomPage}`
    );

    if (!res.ok) return [];

    const data = await res.json();
    return data.results || [];
  };

  const fetchMoviesByGenreId = async (genreId) => {
    const res = await fetch(
      `${API_BASE}/api/tmdb/byGenre?genreId=${genreId}`
    );

    if (!res.ok) return [];

    return await res.json(); // already returns results array
  };

  const fetchTVByGenreId = async (genreId) => {
    const res = await fetch(
      `${API_BASE}/api/tmdb/discover/tv?with_genres=${genreId}`
    );

    if (!res.ok) return [];

    const data = await res.json();
    return data.results || [];
  };

  // -------- Main Loader --------
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);

      const cached = loadFromCacheIfValid();
      if (cached && !cancelled) {
        setItems(cached.slice(0, maxItems));
        setLoading(false);
        return;
      }

      let results = [];

      if (!watchHistory || watchHistory.length === 0) {
        const [movies, tvs] = await Promise.all([
          fetchRandomMovies(),
          fetchRandomTV(),
        ]);
        results = shuffleArray([...movies, ...tvs]);
      } else {
        const userGenreIds = buildGenreProfile();

        if (userGenreIds.length === 0) {
          const [movies, tvs] = await Promise.all([
            fetchRandomMovies(),
            fetchRandomTV(),
          ]);
          results = shuffleArray([...movies, ...tvs]);
        } else {
          const movieRecs = [];
          const tvRecs = [];

          for (const gid of userGenreIds) {
            const [m, t] = await Promise.all([
              fetchMoviesByGenreId(gid),
              fetchTVByGenreId(gid),
            ]);
            movieRecs.push(...m.slice(0, 10));
            tvRecs.push(...t.slice(0, 10));
          }

          results = [...movieRecs, ...tvRecs];

          // Score + Rank
          results = results
            .map((item) => ({
              ...item,
              _score: scoreItem(item, userGenreIds),
            }))
            .sort((a, b) => b._score - a._score);
        }
      }

      // Deduplicate
      const seen = new Set();
      const deduped = [];

      for (const it of results) {
        const key = `${it.media_type || (it.name ? "tv" : "movie")}-${it.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(it);
        if (deduped.length >= maxItems) break;
      }

      saveToCache(deduped);

      if (!cancelled) {
        setItems(deduped);
        setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [profileHash, maxItems]);

  // -------- UI (UNCHANGED) --------
  if (loading || !items) {
    return (
      <section className="px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold mb-4">Movies For You</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-full aspect-[2/3] bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!items.length) return null;

return (
  <section className="px-4 sm:px-6 lg:px-8 mb-16">
    {/* Header */}
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        Movies For You
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Based on what you’ve been watching
      </p>
    </div>

    {/* Static Grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
  
      {items.slice(0,12).map((item,index) => {
const isTV = !!item.name;
const hideOnMobile = index >= 4 && !showAll;

return (
  <Link
    key={`${isTV ? "tv" : "movie"}-${item.id}`}
    to={isTV ? `/tv/${item.id}` : `/movie/${item.id}`}
    className={hideOnMobile ? "hidden md:block" : ""}
  >
    <MovieCard
      id={item.id}
      title={item.title || item.name}
      imageUrl={
        item.poster_path
          ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
          : null
      }
      tmdbRating={
        item.vote_average ? item.vote_average.toFixed(1) : undefined
      }
      isTV={isTV}
    />
  </Link>
);

      })}
    </div>
{!showAll && items.length > 4 && (
  <div className="mt-6 text-center block md:hidden">
    <button
      onClick={() => setShowAll(true)}
      className="px-5 py-2 text-sm font-medium
                 text-indigo-600 dark:text-indigo-400
                 border border-indigo-500/30
                 rounded-full
                 hover:bg-indigo-500/10
                 transition"
    >
      Show more
    </button>
  </div>
)}

  </section>
);


}

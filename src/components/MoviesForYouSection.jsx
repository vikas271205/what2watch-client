// src/components/MoviesForYouSection.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWatchHistory } from "../utils/watchHistory";
import API_BASE from "../utils/api";
import MovieCard from "./MovieCard";
import { TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

// Cache keys
const CACHE_KEY_DATA = "moviesForYou_cache_data";
const CACHE_KEY_TIME = "moviesForYou_cache_time";
const CACHE_KEY_PROFILE = "moviesForYou_cache_profileHash";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export default function MoviesForYouSection({ maxItems = 20 }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const watchHistory = getWatchHistory();
  const scrollRef = useRef(null);

const scroll = (dir) => {
  if (!scrollRef.current) return;
  const scrollAmount = scrollRef.current.clientWidth * 0.8;
  scrollRef.current.scrollBy({
    left: dir === "left" ? -scrollAmount : scrollAmount,
    behavior: "smooth",
  });
};

  // ---- 1. Compute a simple genre profile hash (for personalization cache) ----
  const computeProfileHash = () => {
  if (!watchHistory || watchHistory.length === 0) return "no-history";

  // include ids + genres + timestamps → ensures refresh when history changes
  const signature = watchHistory.map(entry => ({
    id: entry.id,
    genres: entry.genres?.sort().join(",") || "",
    ts: entry.timestamp || 0
  }));

  return JSON.stringify(signature);
  };


  const profileHash = computeProfileHash();

  // ---- 2. Check Cache ----
  const loadFromCacheIfValid = () => {
    try {
      const cacheTime = localStorage.getItem(CACHE_KEY_TIME);
      const cacheProfile = localStorage.getItem(CACHE_KEY_PROFILE);
      const cacheData = localStorage.getItem(CACHE_KEY_DATA);

      if (!cacheTime || !cacheData) return null;

      const age = Date.now() - Number(cacheTime);
      if (age > CACHE_DURATION) return null; // cache expired

      // If personalized, profile hash must match
      if (profileHash !== "no-history" && profileHash !== cacheProfile) return null;

      return JSON.parse(cacheData);
    } catch (err) {
      console.error("[MFY] loadFromCacheIfValid error", err);
      return null;
    }
  };

  // ---- 3. Save to Cache ----
  const saveToCache = (data) => {
    try {
      localStorage.setItem(CACHE_KEY_DATA, JSON.stringify(data));
      localStorage.setItem(CACHE_KEY_TIME, String(Date.now()));
      localStorage.setItem(CACHE_KEY_PROFILE, profileHash);
    } catch (err) {
      console.error("[MFY] saveToCache error", err);
    }
  };

  // ---- Helpers: shuffle ----
  const shuffleArray = (array) =>
    array
      .map((x) => ({ x, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map((a) => a.x);

  // ---- Random fetchers (fallback) ----
  const fetchRandomMovies = async () => {
    try {
      const randomPage = Math.floor(Math.random() * 30) + 1;
      const res = await fetch(
        `${API_BASE}/api/tmdb/discover/movie?page=${randomPage}&sort_by=vote_count.asc&include_adult=false`
      );
      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.error("[MFY] fetchRandomMovies error:", err);
      return [];
    }
  };

  const fetchRandomTV = async () => {
    try {
      const randomPage = Math.floor(Math.random() * 30) + 1;
      const res = await fetch(
        `${API_BASE}/api/tmdb/discover/tv?page=${randomPage}&sort_by=vote_count.asc&include_adult=false`
      );
      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.error("[MFY] fetchRandomTV error:", err);
      return [];
    }
  };

  // ---- Genre-based fetchers (using genre names via search/multi) ----
  const fetchMoviesByGenreKeyword = async (keyword) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/tmdb/search/multi?query=${encodeURIComponent(keyword)}`
      );
      const data = await res.json();
      return (data.results || []).filter((item) => item.media_type === "movie");
    } catch (err) {
      console.error("[MFY] fetchMoviesByGenreKeyword error:", err);
      return [];
    }
  };

  const fetchTVByGenreKeyword = async (keyword) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/tmdb/search/multi?query=${encodeURIComponent(keyword)}`
      );
      const data = await res.json();
      return (data.results || []).filter((item) => item.media_type === "tv");
    } catch (err) {
      console.error("[MFY] fetchTVByGenreKeyword error:", err);
      return [];
    }
  };

  // ---- Pick top genres from history (names) ----
  const pickTopGenres = () => {
    const freq = {};
    watchHistory.forEach((entry) => {
      (entry.genres || []).forEach((g) => {
        freq[g] = (freq[g] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre)
      .slice(0, 2);
  };

  // ---- 7. Main Loader ----
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        const cached = loadFromCacheIfValid();
        if (cached && Array.isArray(cached) && cached.length > 0) {
          console.log("[MFY] Loaded from cache");
          if (!cancelled) {
            setItems(cached.slice(0, maxItems));
            setLoading(false);
          }
          return;
        }

        const history = getWatchHistory();
        let finalResults = [];

        if (!history || history.length === 0) {
          // Fallback random mix
          console.log("[MFY] No history, fetching random mix");
          const [movies, tvs] = await Promise.all([fetchRandomMovies(), fetchRandomTV()]);
          finalResults = shuffleArray([...movies.slice(0, 10), ...tvs.slice(0, 10)]);
        } else {
          // Personalized
          console.log("[MFY] History found, computing personalized results");
          const topGenres = pickTopGenres(); // names

          if (topGenres.length === 0) {
            // fallback
            const [movies, tvs] = await Promise.all([fetchRandomMovies(), fetchRandomTV()]);
            finalResults = shuffleArray([...movies.slice(0, 10), ...tvs.slice(0, 10)]);
          } else {
            // fetch per top genre
            const movieRecs = [];
            const tvRecs = [];
            for (const g of topGenres) {
              const [mByG, tByG] = await Promise.all([
                fetchMoviesByGenreKeyword(g),
                fetchTVByGenreKeyword(g),
              ]);
              movieRecs.push(...(mByG || []).slice(0, 10));
              tvRecs.push(...(tByG || []).slice(0, 10));
            }
            finalResults = shuffleArray([...movieRecs.slice(0, 10), ...tvRecs.slice(0, 10)]);
          }
        }

        // prune, dedupe by id+media type
        const seen = new Set();
        const deduped = [];
        for (const it of finalResults) {
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
      } catch (err) {
        console.error("[MFY] loadData error:", err);
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
    // refresh whenever profileHash changes (watch history changed)
  }, [profileHash, maxItems]);

  // ---- 8. UI ----
  if (loading || !items) {
    return (
      <div className="text-white px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold mb-3">Movies For You</h2>
        <div className="flex gap-4 overflow-x-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-40 h-56 bg-gray-800 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  // ---- 8. UI ----
  return (
    <div className="relative group mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <TrendingUp 
            className="text-gray-700 dark:text-indigo-400"
            size={28}
          />
          <h2 className="text-2xl font-bold text-gray-800 dark:bg-gradient-to-r dark:from-indigo-400 dark:to-purple-500 dark:bg-clip-text dark:text-transparent">
            Movies For You
          </h2>
        </div>
      </div>

      {/* LOADING (Shimmer) */}
      {loading ? (
        <div className="grid grid-flow-col auto-cols-[calc(100%/2.2)] sm:auto-cols-[calc(100%/3.2)] lg:auto-cols-[calc(100%/5.2)] gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="w-full h-56 bg-gray-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="relative">
          {/* Scrollable Row */}
          <div
            ref={scrollRef}
            className="grid grid-flow-col auto-cols-[calc(100%/2.2)]
                      sm:auto-cols-[calc(100%/3.2)]
                      lg:auto-cols-[calc(100%/5.2)]
                      gap-4 overflow-x-auto no-scrollbar py-4 scroll-smooth"
          >
            {items.map((item) => {
              const isTV = !!item.name;
              return (
                <Link
                  key={`${isTV ? "tv" : "movie"}-${item.id}`}
                  to={isTV ? `/tv/${item.id}` : `/movie/${item.id}`}
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

          {/* SCROLL BUTTONS */}
          <button
            onClick={() => scroll("left")}
            className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-4
                       bg-white/80 dark:bg-white/10 backdrop-blur-sm p-2 rounded-full
                       text-gray-800 dark:text-white opacity-0 group-hover:opacity-100
                       transition-opacity duration-300 hover:bg-white 
                       dark:hover:bg-white/20 z-30 shadow-md"
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={() => scroll("right")}
            className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4
                       bg-white/80 dark:bg-white/10 backdrop-blur-sm p-2 rounded-full
                       text-gray-800 dark:text-white opacity-0 group-hover:opacity-100
                       transition-opacity duration-300 hover:bg-white 
                       dark:hover:bg-white/20 z-30 shadow-md"
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No recommendations available right now.
        </p>
      )}
    </div>
  );

}

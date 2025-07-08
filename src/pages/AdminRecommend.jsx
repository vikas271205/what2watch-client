import { useState, useEffect, useRef } from "react";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import API_BASE from "../utils/api";
import useAdminClaim from "../hooks/useAdminClaim";
import { motion } from "framer-motion";

export default function AdminRecommend() {
  const [user, loadingAuth] = useAuthState(auth);
  const { isAdmin } = useAdminClaim();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaType, setMediaType] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", isError: false });
  const inputRef = useRef(null);
  const suggestionRef = useRef(null);

  const searchTMDB = async (retries = 2, delay = 500) => {
    if (!query.trim()) {
      setSuggestions([]);
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    setSuggestions([]);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const filteredResults = (data.results || [])
          .filter((item) => item.media_type === "movie" || item.media_type === "tv")
          .map((item) => ({
            ...item,
            tmdbRating: item.vote_average?.toString(),
            language: item.original_language || null,
            year: (item.release_date || item.first_air_date) ? parseInt((item.release_date || item.first_air_date).split("-")[0]) : null,
          }));
        setResults(filteredResults);
        setSuggestions(filteredResults.slice(0, 5)); // Show up to 5 suggestions
        setLoading(false);
        return;
      } catch (err) {
        console.error(`Search attempt ${attempt} failed:`, err);
        if (attempt === retries) {
          setError("Failed to fetch search results. Please check your network or try again later.");
          setResults([]);
          setSuggestions([]);
          setLoading(false);
        } else {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.title || suggestion.name);
    setSuggestions([]);
    setResults([suggestion]); // Show only the selected suggestion
  };

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: "", isError: false }), 3000);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) searchTMDB();
    }, 300); // Debounce search by 300ms
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Handle input focus and blur to show/hide suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current &&
        suggestionRef.current &&
        !inputRef.current.contains(event.target) &&
        !suggestionRef.current.contains(event.target)
      ) {
        setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addToRecommended = async (item) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        showToast("You must be logged in as admin", true);
        return;
      }

      const token = await user.getIdToken();
      const isMovie = item.media_type === "movie" || item.title;
      const date = isMovie ? item.release_date : item.first_air_date;
      const year = date ? parseInt(date.split("-")[0]) : null;

      const body = {
        id: item.id.toString(),
        type: isMovie ? "movie" : "tv",
        title: isMovie ? item.title : item.name,
        rating: item.vote_average || 0,
        year,
        poster: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : "",
        genre_ids: item.genre_ids || [],
        tmdbRating: item.tmdbRating || null,
        imdbRating: null,
        rtRating: null,
        language: item.language || null,
      };

      console.log("Sending to /api/recommend/add:", body); // Debug log

      const res = await fetch(`${API_BASE}/api/recommend/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      if (result.success) {
        showToast("Successfully added to UNCLE's PICK!");
      } else {
        showToast(`Failed: ${result.error || "Unknown error"}`, true);
      }
    } catch (err) {
      console.error("Error adding to UNCLE's PICK:", err);
      showToast(`Failed to add to UNCLE's PICK: ${err.message}`, true);
    }
  };

  if (loadingAuth) return <p className="p-4 text-white text-center">Checking authentication...</p>;

  if (!user || !isAdmin) {
    return (
      <div className="p-4 text-red-500 text-xl font-semibold text-center">
        ❌ Access denied. You are not authorized to view this page.
      </div>
    );
  }

return (
  <div className="relative min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-black text-black dark:text-white pt-4">
    <div className="p-4 sm:p-6 max-w-6xl mx-auto relative z-10">
      <motion.h1
        className="text-4xl sm:text-5xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-600"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        🎯 Admin – Add to UNCLE's PICK
      </motion.h1>

      <motion.div
        className="relative flex flex-wrap gap-4 mb-6 justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="relative flex-grow">
          <motion.input
            ref={inputRef}
            type="text"
            placeholder="Search movie or TV show..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                searchTMDB();
                setSuggestions([]);
              }
            }}
            onFocus={() => query.trim() && searchTMDB()}
            className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-black dark:text-white border border-gray-400 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-300 dark:hover:bg-gray-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          />
          {suggestions.length > 0 && (
            <motion.ul
              ref={suggestionRef}
              className="absolute z-20 w-full bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600 rounded-lg mt-1 max-h-60 overflow-y-auto scrollbar-thin"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {suggestions.map((suggestion) => (
                <li
                  key={`${suggestion.media_type}_${suggestion.id}`}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-black dark:text-white"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.title || suggestion.name} ({suggestion.media_type === "movie" ? "Movie" : "TV"})
                </li>
              ))}
            </motion.ul>
          )}
        </div>

        <motion.button
          onClick={() => {
            searchTMDB();
            setSuggestions([]);
          }}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Search
        </motion.button>
      </motion.div>

      <motion.div
        className="mb-6 flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <label className="text-lg font-medium text-purple-600 dark:text-purple-300">Filter by Type:</label>
          <motion.select
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-black dark:text-white border border-gray-400 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-300 dark:hover:bg-gray-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <option value="">All</option>
            <option value="movie">Movie</option>
            <option value="tv">TV</option>
            <option value="animation">Animation</option>
          </motion.select>
        </div>
      </motion.div>

      {toast.show && (
        <motion.div
          className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-white font-semibold ${toast.isError ? "bg-red-600" : "bg-green-600"}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          {toast.message}
        </motion.div>
      )}

      {error && (
        <motion.p
          className="text-red-600 dark:text-red-500 text-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {error}
        </motion.p>
      )}

      {loading ? (
        <motion.p
          className="text-gray-600 dark:text-gray-400 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Loading results...
        </motion.p>
      ) : results.length > 0 ? (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {results
            .filter((item) => {
              if (!mediaType) return true;
              if (mediaType === "movie") return item.media_type === "movie";
              if (mediaType === "tv") return item.media_type === "tv";
              if (mediaType === "animation") return item.genre_ids?.includes(16);
              return true;
            })
            .map((item) => {
              const title = item.media_type === "movie" ? item.title : item.name;
              const poster = item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : "https://image.tmdb.org/t/p/w300/poster.jpg?text=No+Image";
              return (
                <motion.div
                  key={`${item.media_type}_${item.id}`}
                  variants={{
                    hidden: { opacity: 0, scale: 0.9, y: 20 },
                    show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } },
                  }}
                  whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                >
                  <div className="bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-800 p-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                    <img
                      src={poster}
                      alt={title}
                      className="w-full h-60 object-cover rounded-lg"
                    />
                    <h2 className="text-base font-semibold mt-2 line-clamp-2 text-black dark:text-white">
                      {title}
                    </h2>
                    <p className="text-sm text-yellow-500 dark:text-yellow-400">⭐ {item.vote_average?.toFixed(1)}</p>
                    <motion.button
                      className="mt-2 w-full px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm rounded-lg font-medium hover:from-green-500 hover:to-green-400 transition-all duration-300"
                      onClick={() => addToRecommended(item)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      ➕ Add to UNCLE's PICK
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
        </motion.div>
      ) : (
        <motion.p
          className="text-gray-600 dark:text-gray-400 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          No results yet. Try searching for a movie or TV show.
        </motion.p>
      )}
    </div>

    <style>
      {`
        .scrollbar-thin::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #6366f1;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background-color: #1f2937;
        }
      `}
    </style>
  </div>
);

}
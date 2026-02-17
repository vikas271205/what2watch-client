import { useState, useEffect, useRef } from "react";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import API_BASE from "../utils/api";
import useAdminClaim from "../hooks/useAdminClaim";


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
        const filteredResults = (Array.isArray(data) ? data : data.results || [])

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
        type: item.media_type === "movie" ? "movie" : "tv",
      };


      //console.log("Sending to /api/recommend/add:", body); // Debug log

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
  <div className="min-h-screen bg-black text-white p-6">
    <div className="max-w-4xl mx-auto">

      <h1 className="text-2xl font-semibold mb-6">
        Admin – Add to UNCLE's PICK
      </h1>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search movie or TV..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") searchTMDB();
          }}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded"
        />

        <button
          onClick={searchTMDB}
          className="px-4 py-2 bg-white text-black rounded"
        >
          Search
        </button>
      </div>

      {loading && <p className="text-gray-400">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Results */}
      <div className="space-y-4">
        {results.map((item) => {
          const title =
            item.media_type === "movie" ? item.title : item.name;

          const poster = item.poster_path
            ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
            : "";

          return (
            <div
              key={`${item.media_type}_${item.id}`}
              className="flex items-center gap-4 bg-gray-900 p-3 rounded"
            >
              {poster && (
                <img
                  src={poster}
                  alt={title}
                  className="w-16 h-24 object-cover rounded"
                />
              )}

              <div className="flex-1">
                <p className="font-medium">{title}</p>
                <p className="text-sm text-gray-400">
                  ⭐ {item.vote_average?.toFixed(1)}
                </p>
              </div>

              <button
                onClick={() => addToRecommended(item)}
                className="px-3 py-1 bg-green-600 rounded text-sm"
              >
                Add
              </button>
            </div>
          );
        })}
      </div>

      {results.length === 0 && !loading && (
        <p className="text-gray-500 mt-6">
          No results
        </p>
      )}

    </div>
  </div>
);


}

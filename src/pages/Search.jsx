import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import MovieCard from "../components/MovieCard";
import genreMap from "../utils/GenreMap";
import API_BASE from "../utils/api";
import { motion } from "framer-motion";

function Search() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialQuery = params.get("q") || "";
  const [queryText, setQueryText] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionRef = useRef(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (initialQuery.trim()) {
      searchTMDB(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      const q = query(
        collection(db, "searches"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);
      const terms = snapshot.docs
        .map((doc) => ({ id: doc.id, term: doc.data().term?.trim() || "" }))
        .filter((item) => item.term);

      const uniqueTerms = Array.from(new Map(terms.map(item => [item.term, item])).values());
      setHistory(uniqueTerms.slice(0, 5)); // Limit history to 5
    };

    fetchHistory();
  }, [user]);

  useEffect(() => {
    const fetchRandomMovies = async () => {
      const randomPage = Math.floor(Math.random() * 10) + 1;
      const res = await fetch(`${API_BASE}/api/tmdb/discover?page=${randomPage}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setResults(data.filter((m) => m.adult === false && m.poster_path).slice(0, 10).map(m => ({
        ...m,
        tmdbRating: m.vote_average?.toString(),
        language: m.original_language,
        genres: m.genre_ids?.map(id => genreMap[id] || ""),
      })));
    };

    if (queryText.trim() === "") {
      fetchRandomMovies();
    }
  }, [queryText]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!queryText.trim() || !inputFocused) {
        setSuggestions([]);
        return;
      }

      const res = await fetch(`${API_BASE}/api/tmdb/search?q=${encodeURIComponent(queryText)}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      const movieTvSuggestions = (data.results || [])
        .filter((item) => (item.media_type === "movie" || item.media_type === "tv") && (item.title || item.name))
        .slice(0, 5);
      setSuggestions(movieTvSuggestions);
    };

    const timeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeout);
  }, [queryText, inputFocused]);

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

  const searchTMDB = async (term) => {
    const res = await fetch(`${API_BASE}/api/tmdb/search?q=${encodeURIComponent(term)}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    setResults((data.results || [])
      .filter((m) => (m.media_type === "movie" || m.media_type === "tv") && !m.adult)
      .slice(0, 10)
      .map(m => ({
        ...m,
        tmdbRating: m.vote_average?.toString(),
        language: m.original_language,
        genres: m.genre_ids?.map(id => genreMap[id] || ""),
      })));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const term = queryText.trim().toLowerCase();
    if (!term) return;

    await searchTMDB(term);
    setSuggestions([]);

    if (user) {
      const alreadyExists = history.find((item) => item.term === term);
      if (!alreadyExists) {
        const id = `${user.uid}_${term}_${Date.now()}`;
        await setDoc(doc(db, "searches", id), {
          userId: user.uid,
          term,
          timestamp: serverTimestamp(),
        });

        setHistory((prev) => [{ id, term }, ...prev.slice(0, 4)]);
      }
    }
  };

  const handleRemoveTerm = async (termToRemove) => {
    const q = query(
      collection(db, "searches"),
      where("userId", "==", user.uid),
      where("term", "==", termToRemove)
    );
    const snapshot = await getDocs(q);
    const deletes = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, "searches", docSnap.id))
    );
    await Promise.all(deletes);
    setHistory((prev) => prev.filter((item) => item.term !== termToRemove));

    if (queryText.toLowerCase() === termToRemove) {
      setQueryText("");
    }
  };

  const handleClearAll = async () => {
    const q = query(collection(db, "searches"), where("userId", "==", user.uid));
    const snapshot = await getDocs(q);
    const deletes = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, "searches", docSnap.id))
    );
    await Promise.all(deletes);
    setHistory([]);
    setResults([]);
    setQueryText("");
  };

  const toggleListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice search not supported");
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setQueryText(transcript);
        await searchTMDB(transcript);
      };

      recognitionRef.current = recognition;
    }

    recognitionRef.current.start();
  };

  return (
    <div className="min-h-screen bg-white text-black dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-gray-800 dark:text-white px-4 sm:px-6 py-6 transition-colors duration-300">
      <motion.h2
        className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 sticky top-0 dark:bg-gray-900/80 backdrop-blur-sm z-10 py-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        🔍 Search Movie & TV Show
      </motion.h2>

      <div className="relative mb-6 sm:mb-8 z-20">
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 sticky top-12 dark:bg-gray-900/80 backdrop-blur-sm z-10 py-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by title, genre, actor..."
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onKeyDown={(e) => e.key === "Enter" && setSuggestions([])}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm sm:text-base text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Search input"
            />
            {suggestions.length > 0 && inputFocused && queryText && (
              <motion.ul
                ref={suggestionRef}
                className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-800 z-50"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {suggestions.map((sug) => (
                  <li
                    key={sug.id}
                    className="px-3 sm:px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer text-sm sm:text-base text-black dark:text-white"
                    onMouseDown={() => {
                      setQueryText(sug.title || sug.name);
                      searchTMDB(sug.title || sug.name);
                      setSuggestions([]);
                    }}
                  >
                    {sug.title || sug.name} ({sug.media_type === "movie" ? "Movie" : "TV"})
                  </li>
                ))}
              </motion.ul>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <motion.button
              type="submit"
              className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-indigo-600 text-sm sm:text-base font-semibold text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Search"
            >
              Search
            </motion.button>
            <motion.button
              type="button"
              onClick={toggleListening}
              className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold border dark:border-gray-700 border-gray-300 ${
                isListening ? "bg-red-600 animate-pulse text-white" : "bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle voice search"
            >
              🎤
            </motion.button>
          </div>
        </form>
      </div>

      {history.length > 0 && (
        <motion.div
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-300">Recent Searches</h3>
            <motion.button
              onClick={handleClearAll}
              className="text-sm sm:text-base text-red-500 hover:underline"
              whileHover={{ scale: 1.05 }}
              aria-label="Clear search history"
            >
              Clear All
            </motion.button>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {history.map(({ term }, index) => term && (
              <div
                key={index}
                className="flex items-center bg-gray-200 dark:bg-gray-800 text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-2 rounded-full"
              >
                <button
                  onClick={() => {
                    setQueryText(term);
                    searchTMDB(term);
                  }}
                  className="hover:underline mr-2 text-black dark:text-white"
                  aria-label={`Search for ${term}`}
                >
                  {term}
                </button>
                <motion.button
                  onClick={() => handleRemoveTerm(term)}
                  className="text-red-500 hover:text-red-600"
                  whileHover={{ scale: 1.1 }}
                  aria-label={`Remove ${term} from history`}
                >
                  ✕
                </motion.button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-gray-200">
          {queryText.trim() ? `Results for "${queryText}"` : "🎲 Discover Random Popular Movies"}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {results.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base col-span-full">No results found.</p>
          ) : (
            results.map((item) => (
              <MovieCard
                key={item.id}
                id={item.id}
                title={item.title || item.name}
                imageUrl={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                tmdbRating={item.tmdbRating}
                genres={item.genres}
                isTV={item.media_type === "tv"}
                language={item.original_language}
              />
            ))
          )}
        </div>
      </motion.div>
    </div>
  );

}

export default Search;
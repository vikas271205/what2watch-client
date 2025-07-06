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
        .map((doc) => ({
          id: doc.id,
          term: (doc.data().term || "").trim(),
        }))
        .filter((item) => item.term);

      const uniqueTerms = Array.from(
        new Map(terms.map((item) => [item.term, item])).values()
      );
      setHistory(uniqueTerms);
    };

    fetchHistory();
  }, [user]);

  useEffect(() => {
    const fetchRandomMovies = async () => {
      const randomPage = Math.floor(Math.random() * 10) + 1;
      const res = await fetch(`/api/tmdb/discover?page=${randomPage}`);
      const data = await res.json();
      const filtered = data.filter((m) => m.adult === false);
      setResults(filtered);
    };

    if (queryText.trim() === "") {
      fetchRandomMovies();
    }
  }, [queryText]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (queryText.trim().length === 0 || !inputFocused) {
        setSuggestions([]);
        return;
      }

      const res = await fetch(`/api/tmdb/search?q=${queryText}`);
      const data = await res.json();
      const movieTvSuggestions = (data.results || []).filter(
        (item) =>
          (item.media_type === "movie" || item.media_type === "tv") &&
          (item.title || item.name)
      );
      setSuggestions(movieTvSuggestions);
    };

    const timeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeout);
  }, [queryText, inputFocused]);

  const searchTMDB = async (term) => {
    const res = await fetch(`/api/tmdb/search?q=${term}`);
    const data = await res.json();
    const filtered = (data.results || []).filter(
      (m) => (m.media_type === "movie" || m.media_type === "tv") && !m.adult
    );
    setResults(filtered);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const term = queryText.trim().toLowerCase();
    if (!term) return;

    await searchTMDB(term);

    if (user) {
      const alreadyExists = history.find((item) => item.term === term);
      if (!alreadyExists) {
        const id = `${user.uid}_${term}_${Date.now()}`;
        await setDoc(doc(db, "searches", id), {
          userId: user.uid,
          term,
          timestamp: serverTimestamp(),
        });

        setHistory((prev) => [{ id, term }, ...prev]);
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
    const q = query(
      collection(db, "searches"),
      where("userId", "==", user.uid)
    );
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
    <div className="px-4 py-10 sm:px-6 lg:px-10 max-w-6xl mx-auto text-white">
      <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center sm:text-left">
        🔍 Search Movies & TV Shows
      </h2>

      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row items-center gap-4 mb-4 relative"
      >
        <input
          type="text"
          placeholder="Search for a movie or TV show..."
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setTimeout(() => setInputFocused(false), 200)}
          className="w-full sm:flex-1 px-4 py-3 rounded-xl border border-gray-500 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="submit"
            className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition w-full sm:w-auto"
          >
            Search
          </button>
          <button
            type="button"
            onClick={toggleListening}
            className={`px-4 py-3 rounded-xl transition font-bold border border-white text-white ${isListening ? "bg-red-600 animate-pulse" : "bg-gray-700 hover:bg-gray-600"}`}
          >
            🎤
          </button>
        </div>
        {suggestions.length > 0 && queryText.trim().length > 0 && inputFocused && (
          <ul className="absolute top-full mt-2 w-full bg-zinc-800 border border-gray-600 rounded-lg shadow-lg z-10 max-h-56 overflow-y-auto">
            {suggestions.map((sug) => (
              <li
                key={sug.id}
                className="px-4 py-2 hover:bg-zinc-700 cursor-pointer"
                onMouseDown={() => {
                  setQueryText(sug.title || sug.name);
                  searchTMDB(sug.title || sug.name);
                }}
              >
                {sug.title || sug.name}
              </li>
            ))}
          </ul>
        )}
      </form>

      {history.length > 0 && (
        <div className="mb-10">
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <h3 className="text-xl font-semibold text-gray-300">
              Recent Searches
            </h3>
            <button
              onClick={handleClearAll}
              className="text-sm text-red-400 hover:underline"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {history.map(({ term }, index) =>
              term ? (
                <div
                  key={index}
                  className="flex items-center bg-gray-700 text-white text-sm px-4 py-2 rounded-full"
                >
                  <button
                    onClick={() => {
                      setQueryText(term);
                      searchTMDB(term);
                    }}
                    className="hover:underline mr-2"
                  >
                    {term}
                  </button>
                  <button
                    onClick={() => handleRemoveTerm(term)}
                    className="text-red-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      <h3 className="text-xl font-bold mb-4 text-gray-200">
        {queryText.trim()
          ? `Results for "${queryText}"`
          : "🎲 Discover Random Popular Movies"}
      </h3>

      <div className="flex flex-wrap gap-4">
        {results.length === 0 ? (
          <p className="text-gray-400">No results found.</p>
        ) : (
          results.map((item) => (
            <MovieCard
              key={item.id}
              id={item.id}
              title={item.title || item.name}
              imageUrl={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
              publicRating={item.vote_average?.toFixed(1)}
              genres={item.genre_ids?.map((id) => genreMap[id] || "")}
              isTV={item.media_type === "tv"}
              language={item.original_language}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Search;
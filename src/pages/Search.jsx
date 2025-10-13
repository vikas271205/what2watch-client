import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth"; 
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
  const [backdropImage, setBackdropImage] = useState(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  
    useEffect(() => {
	    const unsubscribe = onAuthStateChanged(auth, (user) => {
	      setCurrentUser(user);
	    });
	    return () => unsubscribe();
	  }, []);

  
  const processResults = (data) => {
    const filteredResults = (data || [])
      .filter((m) => (m.media_type === "movie" || m.media_type === "tv" || m.media_type === undefined) && !m.adult && m.poster_path)
      .slice(0, 10)
      .map(m => ({
        ...m,
        imageUrl: `https://image.tmdb.org/t/p/w300${m.poster_path}`,
        tmdbRating: m.vote_average?.toString(),
        language: m.original_language,
        genres: m.genre_ids?.map(id => genreMap[id] || ""),
        isTV: m.media_type === "tv",
      }));
    
    setResults(filteredResults);

    if (filteredResults.length > 0 && filteredResults[0].backdrop_path) {
      setBackdropImage(`https://image.tmdb.org/t/p/original${filteredResults[0].backdrop_path}`);
    }
  };

  useEffect(() => {
    if (initialQuery.trim()) {
      searchTMDB(initialQuery);
    }
  }, [initialQuery]);

useEffect(() => {
  if (!currentUser) return;
  const fetchHistory = async () => {
    try {
      const q = query(
        collection(db, "searches"),
        where("userId", "==", currentUser.uid),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);
      const terms = snapshot.docs
        .map((doc) => ({ id: doc.id, term: doc.data().term?.trim() || "" }))
        .filter((item) => item.term);
      const uniqueTerms = Array.from(new Map(terms.map(item => [item.term, item])).values());
      setHistory(uniqueTerms.slice(0, 5));
    } catch (err) {
      console.error("Could not fetch search history:", err);
      setHistory([]);
    }
  };
  fetchHistory();
}, [currentUser]);


  useEffect(() => {
    const fetchRandomMovies = async () => {
      const randomPage = Math.floor(Math.random() * 10) + 1;
      const res = await fetch(`${API_BASE}/api/tmdb/discover?page=${randomPage}`);
      if (!res.ok) return;
      const data = await res.json();
      processResults(data);
    };
    if (queryText.trim() === "") {
      fetchRandomMovies();
    }
  }, [queryText]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!queryText.trim() || !inputFocused) { setSuggestions([]); return; }
      const res = await fetch(`${API_BASE}/api/tmdb/search?q=${encodeURIComponent(queryText)}`);
      if (!res.ok) return;
      const data = await res.json();
      const movieTvSuggestions = (data.results || []).filter((item) => (item.media_type === "movie" || item.media_type === "tv") && (item.title || item.name)).slice(0, 5);
      setSuggestions(movieTvSuggestions);
    };
    const timeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeout);
  }, [queryText, inputFocused]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && suggestionRef.current && !inputRef.current.contains(event.target) && !suggestionRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchTMDB = async (term) => {
    const res = await fetch(`${API_BASE}/api/tmdb/search?q=${encodeURIComponent(term)}`);
    if (!res.ok) return;
    const data = await res.json();
    processResults(data.results);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const term = queryText.trim().toLowerCase();
    if (!term) return;
    await searchTMDB(term);
    setSuggestions([]);
    if (currentUser && !history.find((item) => item.term === term)) {
      const id = `${currentUser.uid}_${term.replace(/\s+/g, '_')}_${Date.now()}`;
      await setDoc(doc(db, "searches", id), { userId: currentUser.uid, term, timestamp: serverTimestamp() });
      setHistory((prev) => [{ id, term }, ...prev.slice(0, 4)]);
    }
  };

  const handleRemoveTerm = async (idToRemove) => {
    if (!currentUser) return;
    await deleteDoc(doc(db, "searches", idToRemove));
    setHistory((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  const handleClearAll = async () => {
    if (!currentUser) return;
    const deletes = history.map(item => deleteDoc(doc(db, "searches", item.id)));
    await Promise.all(deletes);
    setHistory([]);
    setResults([]);
    setQueryText("");
  };

  const toggleListening = () => {
    if (!("webkitSpeechRecognition" in window)) { alert("Voice search not supported"); return; }
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
    <div className="relative min-h-screen bg-white text-black dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-gray-800 dark:text-white transition-colors duration-300">
      {backdropImage && (
        <>
          <div className="fixed inset-0 w-full h-full bg-cover bg-center filter blur-lg scale-110 z-0" style={{ backgroundImage: `url(${backdropImage})` }} />
          <div className="fixed inset-0 w-full h-full bg-black/60 z-0" />
        </>
      )}
      <div className="relative z-10">
        <div className="flex flex-col items-center justify-center text-center px-4 pt-16 pb-12 sm:pt-20 sm:pb-16 overflow-hidden">
          <div className="relative z-10 w-full max-w-2xl">
            <motion.h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              Find Your Next Binge-Watch
            </motion.h2>
            <motion.p className="text-lg text-gray-300 mt-2 mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              Search for any movie or TV show.
            </motion.p>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full">
              <div className="relative flex-1 w-full">
                <input ref={inputRef} type="text" placeholder="Search Inception, The Office, etc..." value={queryText} onChange={(e) => setQueryText(e.target.value)} onFocus={() => setInputFocused(true)} onKeyDown={(e) => e.key === "Enter" && setSuggestions([])} className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 backdrop-blur-sm ring-1 ring-inset ring-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400" aria-label="Search input"/>
                {suggestions.length > 0 && inputFocused && queryText && (
                  <motion.ul ref={suggestionRef} className="absolute top-full mt-2 w-full bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50 text-left">
                    {suggestions.map((sug) => (
                      <li key={sug.id} className="px-4 py-2 hover:bg-indigo-600/50 cursor-pointer" onMouseDown={() => { setQueryText(sug.title || sug.name); processResults([sug]); setSuggestions([]); }}>
                        {sug.title || sug.name} ({sug.media_type === "movie" ? "Movie" : "TV"})
                      </li>
                    ))}
                  </motion.ul>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <motion.button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 font-semibold text-white" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Search</motion.button>
                <motion.button type="button" onClick={toggleListening} className={`px-4 py-3 rounded-xl font-semibold border ${isListening ? "bg-red-600 animate-pulse text-white border-red-500" : "bg-white/10 text-white backdrop-blur-sm border-white/20"}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>🎤</motion.button>
              </div>
            </form>
          </div>
        </div>
        <div className="px-4 sm:px-6 py-6">
          {history.length > 0 && (
            <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold text-gray-200 drop-shadow-md">Recent Searches</h3>
                <motion.button onClick={handleClearAll} className="text-sm text-red-400 hover:underline drop-shadow-md" whileHover={{ scale: 1.05 }}>Clear All</motion.button>
              </div>
              <div className="flex flex-wrap gap-3">
                {history.map(({ id, term }) => (
                  <div key={id} className="flex items-center bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm text-sm px-4 py-2 rounded-full ring-1 ring-inset ring-white/10">
                    <button onClick={() => { setQueryText(term); searchTMDB(term); }} className="hover:underline mr-2 text-white">{term}</button>
                    <motion.button onClick={() => handleRemoveTerm(id)} className="text-red-400 hover:text-red-500" whileHover={{ scale: 1.1 }}>✕</motion.button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-2xl font-bold mb-4 text-white drop-shadow-md">
              {queryText.trim() ? `Results for "${queryText}"` : "🎲 Discover Random Popular Movies"}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.length === 0 && !queryText.trim() ? <p className="text-gray-300 col-span-full text-center">Loading discover movies...</p> : results.length === 0 && queryText.trim() ? <p className="text-gray-300 col-span-full text-center">No results found for "{queryText}".</p> : (results.map((item) => <MovieCard key={item.id} {...item} />))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Search;

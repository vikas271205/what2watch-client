// src/components/Hero.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";
import API_BASE from "../utils/api";
import { Plus, Check } from "lucide-react";
import { motion } from "framer-motion";

function Hero() {
  const [heroMovie, setHeroMovie] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  
  // FIX: Use state for the user to handle async auth changes reliably
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  // FIX: Listen for authentication state changes to get the correct user status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // Effect to fetch the "Uncle's Pick" movie
  useEffect(() => {
    const fetchHeroMovie = async () => {
      try {
        const recommendRes = await fetch(`${API_BASE}/api/recommend/all`);
        const recommendData = await recommendRes.json();
        const validItems = recommendData.filter(item => typeof item.poster === "string");
        if (validItems.length === 0) return;
        const randomItem = validItems[Math.floor(Math.random() * validItems.length)];

        const fullRes = await fetch(`${API_BASE}/api/tmdb/${randomItem.type}/${randomItem.id}`);
        const fullMovieData = await fullRes.json();
        
        // Attach the media type to the movie object for later use
        setHeroMovie({ ...fullMovieData, media_type: randomItem.type });

      } catch (err) {
        console.error("Hero movie fetch failed:", err);
        setHeroMovie(null);
      }
    };

    fetchHeroMovie();
  }, []);

  // FIX: This effect now correctly depends on the reliable `currentUser` state
  useEffect(() => {
	const checkWatchlist = async () => {
	  if (currentUser && heroMovie) {
	    try {
	      const isTV = heroMovie.media_type === 'tv';
	      const docId = isTV ? `${currentUser.uid}_${heroMovie.id}_tv` : `${currentUser.uid}_${heroMovie.id}`;
	      const watchRef = doc(db, "watchlists", docId);
	      
	      // Fetch using getDoc with try/catch, handle non-existence safely
	      const watchSnap = await getDoc(watchRef);
	      setIsSaved(watchSnap.exists()); // true if exists, false otherwise

	    } catch (err) {
	      // Only log errors that are real permission issues
	      if (err.code !== 'permission-denied') {
		console.error("Could not check watchlist status:", err);
	      }
	      setIsSaved(false); // reset state if fetch fails
	    }
	  } else {
	    setIsSaved(false);
	  }
	};

    checkWatchlist();
  }, [currentUser, heroMovie]);

  // FIX: This function now uses the reliable `currentUser` state
  const toggleSave = async () => {
    if (!currentUser) {
        alert("Please log in to manage your watchlist.");
        return;
    }
    if (!heroMovie) return;
    
    const isTV = heroMovie.media_type === 'tv';
    const docId = isTV ? `${currentUser.uid}_${heroMovie.id}_tv` : `${currentUser.uid}_${heroMovie.id}`;
    const ref = doc(db, "watchlists", docId);
    
    try {
      if (isSaved) {
        await deleteDoc(ref);
        setIsSaved(false);
      } else {
        await setDoc(ref, {
          userId: currentUser.uid,
          [isTV ? "tvId" : "movieId"]: isTV ? `${heroMovie.id}_tv` : heroMovie.id,
          title: heroMovie.title || heroMovie.name,
          imageUrl: `https://image.tmdb.org/t/p/w300${heroMovie.poster_path}`,
          rating: heroMovie.vote_average,
          timestamp: serverTimestamp(),
        });
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Failed to toggle watchlist:", err);
      alert("Could not update watchlist. Please try again.");
    }
  };

  if (!heroMovie) {
    return (
      <div className="h-[70vh] flex items-center justify-center bg-gray-900">
        <div className="w-full max-w-4xl px-8 space-y-4">
            <div className="h-16 bg-gray-800 rounded-lg w-3/4 animate-pulse"></div>
            <div className="h-6 bg-gray-800 rounded-lg w-full animate-pulse"></div>
            <div className="h-6 bg-gray-800 rounded-lg w-2/3 animate-pulse"></div>
        </div>
      </div>
    );
  }

  const linkTo = heroMovie.media_type === 'tv' ? `/tv/${heroMovie.id}` : `/movie/${heroMovie.id}`;

  return (
    <div className="relative h-[70vh] font-inter text-white">
      <div
        className="absolute inset-0 bg-cover bg-top"
        style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${heroMovie.backdrop_path})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />

      <div className="relative z-10 flex h-full items-end p-6 sm:p-8 md:p-12">
        <div className="w-full max-w-3xl text-left space-y-4">
          
          <motion.div
            className="inline-block bg-white/10 text-indigo-300 text-sm font-semibold uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-sm ring-1 ring-inset ring-white/20"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          >
            Uncle's Pick
          </motion.div>

          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-xl"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          >
            {heroMovie.title || heroMovie.name}
          </motion.h1>
          
          <motion.p 
            className="text-gray-200 text-base sm:text-lg line-clamp-3 drop-shadow-lg"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          >
            {heroMovie.overview}
          </motion.p>
          
          <motion.div 
            className="flex flex-wrap items-center gap-4 pt-2"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              to={linkTo}
              className="px-6 py-3 bg-white text-black rounded-lg font-bold text-base shadow-lg transition-transform hover:scale-105"
            >
              More Details
            </Link>
            
            <button
              onClick={toggleSave}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-base shadow-lg transition-transform hover:scale-105 ${
                isSaved 
                ? "bg-green-600/80 backdrop-blur-sm" 
                : "bg-white/20 backdrop-blur-sm ring-1 ring-white/20"
              }`}
            >
              {isSaved ? <Check size={20} /> : <Plus size={20} />}
              {isSaved ? "On Watchlist" : "Add to Watchlist"}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Hero;

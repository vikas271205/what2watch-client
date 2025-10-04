import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_BASE from "../utils/api";
import { auth, db } from "../firebase";
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { Plus, Check } from "lucide-react";
import { motion } from "framer-motion";

function Hero() {
  const [heroMovie, setHeroMovie] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const user = auth.currentUser;

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
        
        setHeroMovie(fullMovieData);

      } catch (err) {
        console.error("Hero movie fetch failed:", err);
        setHeroMovie(null);
      }
    };

    fetchHeroMovie();
  }, []);

  useEffect(() => {
    if (!user || !heroMovie) return;
    const checkWatchlist = async () => {
      const docId = `movie_${heroMovie.id}`;
      const watchRef = doc(db, "watchlists", `${user.uid}_${docId}`);
      const watchSnap = await getDoc(watchRef);
      setIsSaved(watchSnap.exists());
    };
    checkWatchlist();
  }, [user, heroMovie]);

  const toggleSave = async () => {
    if (!user || !heroMovie) return;
    const docId = `movie_${heroMovie.id}`;
    const ref = doc(db, "watchlists", `${user.uid}_${docId}`);
    try {
      if (isSaved) {
        await deleteDoc(ref);
        setIsSaved(false);
      } else {
        await setDoc(ref, {
          userId: user.uid,
          movieId: heroMovie.id,
          title: heroMovie.title,
          imageUrl: `https://image.tmdb.org/t/p/w300${heroMovie.poster_path}`,
          timestamp: serverTimestamp(),
        });
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Failed to toggle watchlist:", err);
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

  return (
    <div className="relative h-[70vh] font-inter text-white">
      <div
        className="absolute inset-0 bg-cover bg-top"
        style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${heroMovie.backdrop_path})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />

      <div className="relative z-10 flex h-full items-end p-6 sm:p-8 md:p-12">
        <div className="w-full max-w-3xl text-left space-y-4">
          
          {/* --- This is the new "Frosted Glass" Badge --- */}
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
              to={`/movie/${heroMovie.id}`}
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
// src/components/MovieCard.jsx

import React, { useState, useEffect, useRef } from "react"; 
import { Link, useLocation } from "react-router-dom";
import { auth, db } from "../firebase"; // FIX: Use the shared 'db' instance imported from your firebase config.
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { calculateUncleScore } from "../utils/uncleScore";
import API_BASE from "../utils/api";
import ScoreCircle from "./ScoreCircle";

function MovieCard({
  id,
  title,
  imageUrl,
  genres = [],
  isTV = false,
  type,
  tmdbRating,
  imdbRating,
  rtRating,
  uncleScore,
  isSaved: initialIsSaved,
  year,
  isAdmin = false,
  onDelete,
  showUncleScore = true,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(initialIsSaved || false);
  // REMOVED: Redundant and problematic Firestore initialization.
  // const db = getFirestore(); 
const [currentUser, setCurrentUser] = useState(auth.currentUser);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setCurrentUser(user);
  });
  return () => unsubscribe();
}, []);

  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  const finalUncleScore = (uncleScore != null) 
    ? uncleScore 
    : calculateUncleScore(tmdbRating, imdbRating, rtRating);

  const linkTo = type === "tv" || isTV ? `/tv/${id}` : `/movie/${id}`;
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });
    const currentCardRef = cardRef.current;
    if (currentCardRef) observer.observe(currentCardRef);
    return () => { if (currentCardRef) observer.unobserve(currentCardRef) };
  }, []);

useEffect(() => {
  const checkWatchlist = async () => {
    if (!currentUser) {
      setIsSaved(false);
      return;
    }

    try {
      const docId = isTV ? `${currentUser.uid}_${id}_tv` : `${currentUser.uid}_${id}`;
      const watchRef = doc(db, "watchlists", docId);
      const watchSnap = await getDoc(watchRef);
      setIsSaved(watchSnap.exists());
    } catch (err) {
      // Only log real permission errors, but still reset state
      if (err.code !== "permission-denied") console.error("Could not check watchlist status:", err);
      setIsSaved(false);
    }
  };

  checkWatchlist();
}, [currentUser, id, isTV]);


const toggleSave = async (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (!currentUser) {
    alert("Please log in to manage your watchlist.");
    return;
  }

  setIsLoading(true);
  try {
    const docId = isTV ? `${currentUser.uid}_${id}_tv` : `${currentUser.uid}_${id}`;
    const ref = doc(db, "watchlists", docId);

    if (isSaved) {
      await deleteDoc(ref);
      setIsSaved(false);
    } else {
      await setDoc(ref, {
        userId: currentUser.uid,
        [isTV ? "tvId" : "movieId"]: isTV ? `${id}_tv` : id,
        title,
        imageUrl,
        rating: tmdbRating,
        timestamp: serverTimestamp(),
      });
      setIsSaved(true);
    }
  } catch (err) {
    console.error("Failed to toggle watchlist:", err);
    alert("Could not update watchlist. Please try again.");
  } finally {
    setIsLoading(false);
  }
};
  
  const handleAdminDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onDelete || !isAdmin) return;
    if (!window.confirm(`Delete "${title}" from recommended?`)) return;
    try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`${API_BASE}/api/recommend/${type}_${id}`, {
            method: "DELETE", headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Server responded with an error');
        const result = await res.json();
        if (result.success) {
            onDelete(`${type}_${id}`);
        } else {
            alert(result.error || "Failed to delete");
        }
    } catch(err) {
        console.error("Failed to delete recommendation:", err);
        alert("An error occurred while deleting.");
    }
  };

  return (
    <Link
      to={linkTo}
      ref={cardRef}
      aria-label={`View details for ${title}`}
      className={`w-full shrink-0 font-inter ${isVisible ? "animate-fadeInUp" : "opacity-0"} block relative rounded-xl overflow-hidden shadow-lg group transition-transform duration-300 hover:scale-105 hover:shadow-2xl`}
    >
      <div className="relative aspect-[2/3] bg-slate-200 dark:bg-gray-800">
        <img
          src={imageUrl || "https://via.placeholder.com/300x450/e2e8f0/9ca3af?text=No+Image"}
          alt={`Poster for ${title}`}
          className="w-full h-full object-cover"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-end p-3 text-white">
          <h3 className="text-sm font-bold line-clamp-2 drop-shadow-lg mb-2">
            {title}
          </h3>

          <div className="flex gap-1.5 flex-wrap">
            {year && (
              <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-slate-200 text-slate-700 dark:bg-black/30 dark:text-slate-200">
                {year}
              </span>
            )}
            {genres.slice(0, 2).map((genre, i) => genre && (
              <span key={`${genre}-${i}`} className="text-xs font-semibold rounded-full px-2.5 py-1 bg-slate-200 text-slate-700 dark:bg-black/30 dark:text-slate-200">
                {genre}
              </span>
            ))}
          </div>
        </div>
        
       {currentUser && (
          <button onClick={toggleSave} disabled={isLoading} aria-label={isSaved ? `Remove ${title} from watchlist` : `Add ${title} to watchlist`} className={`absolute top-2 right-2 rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold transition-all duration-200 transform hover:scale-110 shadow-md ${isSaved ? "bg-green-500 hover:bg-green-400 text-white" : "bg-gray-800/60 hover:bg-gray-700/80 text-white backdrop-blur-sm"}`}>
            {isLoading ? '...' : (isSaved ? "✓" : "+")}
          </button>
        )}
        {showUncleScore && finalUncleScore != null && (
          <div className="absolute top-1 left-1 bg-black/50 rounded-full">
             <ScoreCircle score={finalUncleScore} />
          </div>
        )}
        {location.pathname === "/unclespick" && isAdmin && onDelete && (
          <button onClick={handleAdminDelete} className="absolute top-12 right-2 p-1.5 rounded-full text-xs font-medium backdrop-blur-md bg-red-600/80 hover:bg-red-500/90 text-white">
            🗑️
          </button>
        )}
      </div>
    </Link>
  );
}

// React.memo is used to prevent unnecessary re-renders of the card
export default React.memo(MovieCard);

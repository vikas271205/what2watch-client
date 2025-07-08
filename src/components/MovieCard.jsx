import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { getFirestore, doc, setDoc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";
import languageMap from "../utils/LanguageMap";
import { calculateUncleScore } from "../utils/uncleScore";

function MovieCard({
  id,
  title,
  imageUrl,
  showRemoveButton = false,
  onRemove,
  genres = [],
  size = "small",
  isTV = false,
  type,
  language,
  tmdbRating,
  imdbRating,
  rtRating,
  isSaved: initialIsSaved,
  year,
  isAdmin = false,
  onDelete,
  showUncleScore = true,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(initialIsSaved || false);
  const db = getFirestore();
  const user = auth.currentUser;
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const finalUncleScore = calculateUncleScore(tmdbRating, imdbRating, rtRating);

  const width = size === "large" ? "w-48 sm:w-56 lg:w-64" : "w-40 sm:w-48 lg:w-52";

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => cardRef.current && observer.unobserve(cardRef.current);
  }, []);

  useEffect(() => {
    if (!user) {
      setIsSaved(false);
      return;
    }

    const checkWatchlist = async () => {
      try {
        const docId = isTV ? `${user.uid}_${id}_tv` : `${user.uid}_${id}`;
        const watchRef = doc(db, "watchlists", docId);
        const watchSnap = await getDoc(watchRef);
        setIsSaved(watchSnap.exists());
      } catch (err) {
        console.error("Failed to check watchlist:", err);
      }
    };

    checkWatchlist();
  }, [user, id, isTV]);

  const toggleSave = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const docId = isTV ? `${user.uid}_${id}_tv` : `${user.uid}_${id}`;
      const ref = doc(db, "watchlists", docId);
      if (isSaved) {
        await deleteDoc(ref);
        setIsSaved(false);
      } else {
        await setDoc(ref, {
          userId: user.uid,
          [isTV ? "tvId" : "movieId"]: isTV ? `${id}_tv` : id,
          title,
          imageUrl,
          language,
          rating: tmdbRating,
          timestamp: serverTimestamp(),
        });
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Failed to toggle watchlist:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminDelete = async () => {
    if (!onDelete || !isAdmin) return;
    const confirmDelete = window.confirm(`Delete "${title}" from recommended?`);
    if (!confirmDelete) return;
    const token = await user.getIdToken();

    const res = await fetch(
      `${import.meta.env.VITE_API_BASE || ""}/api/recommend/${type}_${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const result = await res.json();
    if (result.success) {
      onDelete(`${type}_${id}`);
    } else {
      alert(result.error || "Failed to delete");
    }
  };

  const linkTo = type === "tv" || isTV ? `/tv/${id}` : `/movie/${id}`;

  return (
    <div
      ref={cardRef}
      className={`${width} max-w-full mx-auto shrink-0 font-inter ${isVisible ? "animate-fadeInUp" : "opacity-0"}`}
    >
      {isLoading ? (
        <div className="relative bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse">
          <div className="aspect-[2/3] bg-gray-700 rounded-t-xl"></div>
          <div className="p-4 space-y-2">
            <div className="h-5 bg-gray-700 rounded w-3/4"></div>
            <div className="flex gap-1">
              <div className="h-4 bg-gray-700 rounded w-16"></div>
              <div className="h-4 bg-gray-700 rounded w-16"></div>
            </div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ) : (
        <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-2xl group hover:ring-2 hover:ring-purple-600/50">
          <div className="relative aspect-[2/3]">
            <Link to={linkTo} aria-label={`View details for ${title}`}>
              <img
                src={imageUrl || "https://image.tmdb.org/t/p/w300/poster.jpg?text=No+Image"}
                alt={`Poster for ${title}`}
                className="rounded-t-xl w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-90"
              />
            </Link>

            {user && (
              <button
                onClick={toggleSave}
                className={`absolute top-3 right-3 rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold transition-all duration-200 transform hover:scale-110 shadow-md z-10 ${
                  isSaved ? "bg-green-400 hover:bg-green-300 text-white" : "bg-gray-500 hover:bg-gray-400 text-white"
                }`}
                aria-label={isSaved ? `Remove ${title} from watchlist` : `Add ${title} to watchlist`}
              >
                {isSaved ? "✅" : "➕"}
              </button>
            )}

            {showUncleScore && finalUncleScore != null && (
              <div
                className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-lg px-3 py-1.5 shadow-xl animate-zoomIn border border-purple-200/30"
                aria-live="polite"
              >
                🎯 {finalUncleScore}
              </div>
            )}
            {location.pathname === "/recommended" && isAdmin && onDelete && (
              <button
                onClick={handleAdminDelete}
                className="absolute top-3 right-16 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md bg-black/70 hover:bg-black/90 text-red-400 hover:text-red-300"
              >
                🗑
              </button>
            )}
          </div>

          <div className="p-4 text-white space-y-2">
            <h3 className="text-base font-bold line-clamp-1 group-hover:text-purple-300 transition-colors duration-200">
              {title}
            </h3>

            <div className="text-sm text-gray-300">
              {year ? `${year} • ${type?.toUpperCase()}` : type?.toUpperCase()}
            </div>

            {genres.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {genres.slice(0, 2).map((genre, i) => (
  genre && (
    <span key={`${genre}-${i}`} className="text-xs bg-purple-600/40 rounded-full px-2 py-1 text-gray-200">
      {genre}
    </span>
  )
))}

              </div>
            )}

            {language && (
              <p className="text-sm text-gray-300">
                🌐 {languageMap[language] || language?.toUpperCase() || "N/A"}
              </p>
            )}

            {showUncleScore && finalUncleScore == null && (
              <p className="text-xs text-gray-500">Uncle Score unavailable</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(MovieCard);
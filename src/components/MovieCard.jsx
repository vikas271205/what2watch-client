import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { calculateUncleScore } from "../utils/uncleScore";
import languageMap from "../utils/LanguageMap";
const API_BASE = process.env.REACT_APP_API_BASE_URL;

function MovieCard({
  id,
  title,
  imageUrl,
  publicRating,
  userRating,
  showRemoveButton = false,
  onRemove,
  genres = [],
  size = "small",
  isTV = false,
  language,
  onRate,
  showUncleScore = true,
  inChat = false,
}) {
  const [isSaved, setIsSaved] = useState(false);
  const [uncleScore, setUncleScore] = useState(null);
  const db = getFirestore();
  const user = auth.currentUser;

  const width = inChat
    ? "w-40 sm:w-48 lg:min-w-[140px]"
    : size === "large"
    ? "w-48 sm:w-56 lg:min-w-[192px]"
    : "w-40 sm:w-48 lg:min-w-[144px]";

  useEffect(() => {
    const checkWatchlist = async () => {
      if (!user || showRemoveButton) return;
      const ref = doc(db, "watchlists", `${user.uid}_${id}`);
      const docSnap = await getDoc(ref);
      setIsSaved(docSnap.exists());
    };

    checkWatchlist();
  }, [id, showRemoveButton, user]);

  useEffect(() => {
    const loadOMDbData = async () => {
      if (!showUncleScore || !title || publicRating == null) return;

      try {
        const res = await fetch(
          `${API_BASE}/api/omdb?title=${encodeURIComponent(title)}`
        );
        const omdb = await res.json();

        const rtRating = omdb?.Ratings?.find(
          (r) => r.Source === "Rotten Tomatoes"
        )?.Value;
        const imdbRating = omdb?.imdbRating;

        const score = calculateUncleScore(publicRating, imdbRating, rtRating);
        setUncleScore(score);
      } catch (err) {
        console.error("OMDb backend fetch failed:", err);
      }
    };

    loadOMDbData();
  }, [title, publicRating, showUncleScore]);

  const toggleSave = async () => {
    if (!user) return;
    const ref = doc(db, "watchlists", `${user.uid}_${id}`);
    if (isSaved) {
      await deleteDoc(ref);
      setIsSaved(false);
    } else {
      await setDoc(ref, {
        userId: user.uid,
        movieId: id,
        title,
        imageUrl,
        rating: publicRating,
        language,
        timestamp: serverTimestamp(),
      });
      setIsSaved(true);
    }
  };

  return (
    <div className={`${width} max-w-full mx-auto shrink-0 animate-slideUp font-inter`}>
      <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 group hover:shadow-2xl group-hover:ring-2 group-hover:ring-purple-600/50">
        <div className="relative aspect-[2/3]">
          <Link to={isTV ? `/tv/${id}` : `/movie/${id}`}>
            <img
              src={imageUrl || "https://image.tmdb.org/t/p/w300/poster.jpg?text=No+Image"}
              alt={title}
              className="rounded-t-xl w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-85"
            />
          </Link>

          {showUncleScore && uncleScore !== null && (
            <div className="absolute top-3 left-3 bg-purple-400 text-white text-sm font-bold rounded-lg px-3 py-1.5 shadow-xl animate-zoomIn border border-purple-200/50">
              🎯 {uncleScore}
            </div>
          )}

          <button
            onClick={showRemoveButton ? onRemove : toggleSave}
            className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md bg-black/70 hover:bg-black/90 shadow-md z-20 transition-colors duration-200 ${
              showRemoveButton
                ? "text-red-400 hover:text-red-300"
                : isSaved
                ? "text-indigo-500 hover:text-indigo-400"
                : "text-indigo-500 hover:text-indigo-400"
            }`}
          >
            {showRemoveButton ? "✖ Remove" : isSaved ? "✔ Saved" : "➕ Add"}
          </button>
        </div>

        <div className="p-4 text-white space-y-2">
          <h3 className="text-base font-bold line-clamp-1 group-hover:animate-marquee">{title}</h3>

          {genres.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {genres.slice(0, 2).map((genre) => (
                <span key={genre} className="text-xs bg-purple-600/30 rounded px-1.5 py-0.5 text-gray-200">
                  {genre}
                </span>
              ))}
            </div>
          )}

          {showUncleScore && uncleScore === null && (
            <p className="text-sm text-gray-400 animate-pulseSlow">Loading score…</p>
          )}

          {onRate && (
            <div className="flex items-center gap-1.5 text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => onRate(star)}
                  className={`cursor-pointer text-lg ${
                    userRating && star <= Math.round(userRating)
                      ? "text-yellow-400"
                      : "text-gray-500"
                  } hover:text-yellow-300 transition-transform duration-150 hover:animate-zoomIn`}
                >
                  ★
                </span>
              ))}
              {userRating && (
                <span className="text-sm text-gray-300 ml-2">
                  ({userRating.toFixed(1)})
                </span>
              )}
            </div>
          )}

          <p className="text-sm text-gray-300">
            🌐 {languageMap[language] || language?.toUpperCase() || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;
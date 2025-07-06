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
import genreMap from "../utils/GenreMap";

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

  const width =
    size === "large"
      ? "min-w-[160px] sm:min-w-[192px]"
      : "min-w-[120px] sm:min-w-[144px]";

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
        const res = await fetch(`/api/omdb?title=${encodeURIComponent(title)}`);
        const omdb = await res.json();

        const rtRating = omdb?.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value;
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
    <div className={`${inChat ? "w-[140px] sm:w-[160px]" : width} shrink-0`}>
      <div className="relative bg-black rounded-md transition-transform duration-200 hover:scale-105 group">
        <div className="relative">
          <Link to={isTV ? `/tv/${id}` : `/movie/${id}`}>
            <img
              src={imageUrl || "https://via.placeholder.com/300x450?text=No+Image"}
              alt={title}
              className="rounded-md w-full object-cover"
            />
          </Link>

          <button
            onClick={showRemoveButton ? onRemove : toggleSave}
            className={`absolute bottom-2 right-2 px-2 py-1 rounded-full text-xs backdrop-blur-sm bg-black/60 hover:bg-black/80 shadow-lg z-20 ${
              showRemoveButton
                ? "text-red-400 hover:text-red-500"
                : isSaved
                ? "text-green-400 hover:text-green-500"
                : "text-blue-400 hover:text-blue-500"
            }`}
          >
            {showRemoveButton ? "✖" : isSaved ? "✔ Saved" : "➕ Add"}
          </button>
        </div>

        <div className="mt-2 text-xs text-white space-y-1 px-0.5 pb-1">
          <h3 className="text-sm font-semibold line-clamp-1">{title}</h3>

          {showUncleScore && (
            uncleScore !== null ? (
              <p className="text-green-400">🎯 Uncle Score: {uncleScore}</p>
            ) : (
              <p className="text-gray-400">Loading score…</p>
            )
          )}

          <p className="text-gray-400">
            🌐 {languageMap[language] || language?.toUpperCase() || "N/A"}
          </p>

          {onRate && (
            <div className="flex gap-0.5 items-center text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => onRate(star)}
                  className={`cursor-pointer ${
                    userRating && star <= Math.round(userRating)
                      ? "text-yellow-400"
                      : "text-gray-600"
                  }`}
                >
                  ★
                </span>
              ))}
              {userRating && (
                <span className="text-gray-400 ml-1">
                  ({userRating.toFixed(1)})
                </span>
              )}
            </div>
          )}

          {genres.length > 0 && (
  <p className="text-gray-400 truncate">
    {genres.slice(0, 2).join(", ")}
  </p>
)}

        </div>
      </div>
    </div>
  );
}

export default MovieCard;

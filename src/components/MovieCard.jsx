import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase"; // Adjusted import
import { getFirestore, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import languageMap from "../utils/LanguageMap";

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
  uncleScore,
  isSaved,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const db = getFirestore();
  const user = auth.currentUser;
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const width = inChat
    ? "w-40 sm:w-48 lg:w-48"
    : size === "large"
    ? "w-48 sm:w-56 lg:w-64"
    : "w-40 sm:w-48 lg:w-52";

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  const toggleSave = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const ref = doc(db, "watchlists", `${user.uid}_${id}`);
      if (isSaved) {
        await deleteDoc(ref);
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
      }
    } catch (err) {
      console.error("Failed to toggle watchlist:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`${width} max-w-full mx-auto shrink-0 font-inter ${isVisible ? "animate-fadeInUp" : "opacity-0"}`}
      data-movie-id={id}
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
            <Link to={isTV ? `/tv/${id}` : `/movie/${id}`} aria-label={`View details for ${title}`}>
              <img
                src={imageUrl || "https://image.tmdb.org/t/p/w300/poster.jpg?text=No+Image"}
                alt={`Poster for ${title}`}
                className="rounded-t-xl w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-90"
              />
            </Link>

            {showUncleScore && uncleScore !== null && (
              <div
                className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-lg px-3 py-1.5 shadow-xl animate-zoomIn border border-purple-200/30"
                aria-live="polite"
              >
                🎯 {uncleScore}
              </div>
            )}

            <button
              onClick={showRemoveButton ? onRemove : toggleSave}
              className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md bg-black/70 hover:bg-black/90 shadow-md z-20 transition-colors duration-200 ${
                showRemoveButton
                  ? "text-red-400 hover:text-red-300"
                  : isSaved
                  ? "text-green-400 hover:text-green-300"
                  : "text-indigo-400 hover:text-indigo-300"
              }`}
              aria-label={showRemoveButton ? `Remove ${title} from watchlist` : isSaved ? `Remove ${title} from watchlist` : `Add ${title} to watchlist`}
            >
              {showRemoveButton ? "✖" : isSaved ? "✔" : "➕"}
            </button>
          </div>

          <div className="p-4 text-white space-y-3">
            <h3 className="text-base font-bold line-clamp-1 group-hover:text-purple-300 transition-colors duration-200">{title}</h3>

            {genres.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {genres.slice(0, 2).map((genre) => (
                  <span
                    key={genre}
                    className="text-xs bg-purple-600/40 rounded-full px-2 py-1 text-gray-200 transition-colors duration-200 group-hover:bg-purple-600/60"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {showUncleScore && uncleScore === null && !isLoading && (
              <p className="text-sm text-gray-400">Score unavailable</p>
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
                    aria-label={`Rate ${title} ${star} stars`}
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
      )}
    </div>
  );
}

export default React.memo(MovieCard);
// src/components/MovieCard.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { computeUncleScore } from "../utils/uncleScoreEngine";
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
  popularity,
  voteCount,
  isSaved: initialIsSaved,
  year,
  isAdmin = false,
  onDelete,
  showUncleScore = true,
}) {
   const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  // ---------------------------
  // ALWAYS COMPUTE UNCLE SCORE HERE
  // ---------------------------

  const scoreObj = computeUncleScore({
    tmdb: tmdbRating,
    imdb: imdbRating,
    rt: rtRating,
    popularity,
    genres,
    voteCount,
    releaseYear: year,
  });

  const finalScoreNumber = scoreObj?.score ?? null;
  const finalBadge = scoreObj?.badge ?? null;

  const finalColor =
    finalScoreNumber >= 8.5 ? "#16a34a" :
    finalScoreNumber >= 7   ? "#2563eb" :
    finalScoreNumber >= 5.5 ? "#ca8a04" :
    finalScoreNumber >= 4   ? "#f87171" :
    "#525252";

  const linkTo = isTV || type === "tv" ? `/tv/${id}` : `/movie/${id}`;

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        obs.unobserve(entry.target);
      }
    }, { threshold: 0.1 });

    if (cardRef.current) obs.observe(cardRef.current);
    return () => { if (cardRef.current) obs.unobserve(cardRef.current); };
  }, []);



  const handleAdminDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onDelete || !isAdmin) return;
    if (!window.confirm(`Delete "${title}" from recommended?`)) return;

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_BASE}/api/recommend/${type}_${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const r = await res.json();
      if (r.success) onDelete(`${type}_${id}`);
      else alert(r.error || "Failed to delete");
    } catch {
      alert("An error occurred while deleting.");
    }
  };

  return (
    <Link
      to={linkTo}
      ref={cardRef}
      className={`w-full shrink-0 font-inter ${
        isVisible ? "animate-fadeInUp" : "opacity-0"
      } block relative rounded-xl overflow-hidden shadow-lg group transition-transform duration-300 hover:scale-105 hover:shadow-2xl`}
    >
      <div className="relative aspect-[2/3] bg-slate-200 dark:bg-gray-800">
        <img
          src={imageUrl || "https://via.placeholder.com/300x450"}
          alt={title}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-3 text-white">


          <h3 className="text-sm font-bold line-clamp-2 drop-shadow-lg">{title}</h3>

          {year && (
            <span className="text-xs font-semibold mt-1 bg-black/30 px-2 py-0.5 rounded-md w-fit">
              {year}
            </span>
          )}
        </div>

{finalBadge && (
  <div
    className="absolute top-1 right-1 px-2 py-1 rounded-full text-[10px] font-bold shadow-md backdrop-blur-sm"
    style={{
      backgroundColor: finalColor + "cc",
      color: "#fff",
      border: `1px solid ${finalColor}`,
    }}
  >
    {finalBadge}
  </div>
)}



        {showUncleScore && finalScoreNumber != null && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md rounded-full p-1.5 shadow-xl">
   <ScoreCircle score={finalScoreNumber} color={finalColor} />
          </div>
        )}

        {location.pathname === "/unclespick" && isAdmin && onDelete && (
          <button
            onClick={handleAdminDelete}
            className="absolute top-12 right-2 p-1.5 rounded-full text-xs font-medium backdrop-blur-md bg-red-600/80 hover:bg-red-500/90 text-white"
          >
            🗑️
          </button>
        )}
      </div>
    </Link>
  );
}

export default React.memo(MovieCard);

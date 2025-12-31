import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { computeUncleScore } from "../utils/uncleScoreEngine";
import ScoreCircle from "./ScoreCircle";

function LandscapeCard({
  id,
  title,
  backdropLarge,
  backdropSmall,
  firstAirYear,
  seasons,
  genres = [],
  tmdbRating,
  imdbRating,
  rtRating,
  popularity,
  voteCount,
  isTV = false,
  large = false,
  compact = false,
  showTitle = true,
}) {
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) obs.observe(cardRef.current);
    return () => obs.disconnect();
  }, []);

  const linkTo = isTV ? `/tv/${id}` : `/movie/${id}`;

  // ---------- Uncle Score (same logic as MovieCard) ----------
  const scoreObj = computeUncleScore({
    tmdb: tmdbRating,
    imdb: imdbRating,
    rt: rtRating,
    popularity,
    genres,
    voteCount,
    releaseYear: firstAirYear,
  });

  const score = scoreObj?.score ?? null;
  const badge = scoreObj?.badge ?? null;

  const color =
    score >= 8 ? "#16a34a" :
    score >= 7   ? "#2563eb" :
    score >= 5.5 ? "#ca8a04" :
    score >= 4   ? "#f87171" :
    "#525252";

  // ---------- Size control ----------
  const heightClass = large
    ? "aspect-[16/9] min-h-[220px]"
    : compact
    ? "aspect-[16/9] h-full"
    : "aspect-video";

  const imageSrc = large ? backdropLarge : backdropSmall;

  return (
    <Link
      to={linkTo}
      ref={cardRef}
      className={`relative block overflow-hidden rounded-xl
        bg-gray-200 dark:bg-gray-800 shadow-md
        transition-transform duration-300
        ${heightClass}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
      `}
    >
      {/* Image */}
      <img
        src={imageSrc}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Uncle Score */}
      {score != null && (
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md rounded-full p-1.5">
          <ScoreCircle score={score} color={color} />
        </div>
      )}

      {/* Badge */}
      {badge && (
        <div
          className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold"
          style={{ backgroundColor: color + "cc", color: "#fff" }}
        >
          {badge}
        </div>
      )}

      {/* Metadata */}
      {showTitle && (
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-base font-semibold drop-shadow line-clamp-1">
            {title}
          </h3>

          <div className="mt-1 text-xs text-white/80 flex gap-2">
            <span>TV Series</span>
            {firstAirYear && <span>• {firstAirYear}</span>}
            {seasons && <span>• {seasons} Seasons</span>}
          </div>
        </div>
      )}
    </Link>
  );
}

export default React.memo(LandscapeCard);

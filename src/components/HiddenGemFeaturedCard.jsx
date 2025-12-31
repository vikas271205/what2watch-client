import { Link } from "react-router-dom";

export default function HiddenGemFeaturedCard({
  id,
  title,
  year,
  overview,
  imageUrl,
  tmdbRating,
  rank,
  isTV,
}) {
  return (
    <Link
      to={isTV ? `/tv/${id}` : `/movie/${id}`}
      className="flex gap-4 bg-gray-100 dark:bg-neutral-900 rounded-xl p-4 hover:bg-gray-200/60 dark:hover:bg-neutral-800 transition"
    >
      <img
        src={imageUrl}
        alt={title}
        className="w-28 h-40 object-cover rounded-lg shrink-0"
      />

      <div className="flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold text-indigo-500">
            #{rank}
          </span>

          <h3 className="text-base font-semibold text-gray-900 dark:text-white mt-1">
            {title}
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {year} • {isTV ? "TV Series" : "Movie"}
          </p>

          <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 line-clamp-3">
            {overview}
          </p>
        </div>

        {tmdbRating && (
          <div className="mt-3 text-sm font-medium text-amber-500">
            ⭐ {tmdbRating.toFixed(1)} TMDB
          </div>
        )}
      </div>
    </Link>
  );
}

import { Link } from "react-router-dom";

export default function HiddenGemCompactCard({
  id,
  title,
  imageUrl,
  rank,
  isTV,
}) {
  return (
    <Link
      to={isTV ? `/tv/${id}` : `/movie/${id}`}
      className="group"
    >
      <div className="relative">
        <img
          src={imageUrl}
          alt={title}
          className="w-full aspect-[2/3] object-cover rounded-lg"
        />

        <span className="absolute top-2 left-2 bg-black/70 text-white text-xs font-semibold px-2 py-0.5 rounded-md">
          #{rank}
        </span>
      </div>

      <h4 className="mt-2 text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
        {title}
      </h4>
    </Link>
  );
}

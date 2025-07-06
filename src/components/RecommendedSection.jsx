import { useEffect, useState, useRef } from "react";
import MovieCard from "../components/MovieCard";
import { calculateUncleScore } from "../utils/uncleScore";
import genreMap from "../utils/GenreMap";

function Recommended() {
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/tmdb/discover");
        const data = await res.json();
        const shuffled = data.sort(() => 0.5 - Math.random());

        const top30 = shuffled.filter(
          (item) => item.poster_path && item.title || item.name
        ).slice(0, 30);

        const results = await Promise.allSettled(
          top30.map(async (item) => {
            const title = item.title || item.name;
            const rating = item.vote_average;
            const language = item.original_language;

            try {
              const omdbRes = await fetch(`/api/omdb?title=${encodeURIComponent(title)}`);
              const omdb = await omdbRes.json();

              const rtRating = omdb?.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value;
              const imdbRating = omdb?.imdbRating;

              const uncleScore = calculateUncleScore(rating, imdbRating, rtRating);
              if (uncleScore >= 7.5) {
                return {
                  id: item.id,
                  title,
                  imageUrl: `https://image.tmdb.org/t/p/w300${item.poster_path}`,
                  rating,
                  language,
                  genres: item.genre_ids.map((id) => genreMap[id]).filter(Boolean),
                  isTV: item.media_type === "tv" || !!item.name,
                };
              }
            } catch (err) {
              console.warn("OMDb failed:", title, err);
            }
            return null;
          })
        );

        const validResults = results
          .map((r) => r.status === "fulfilled" && r.value)
          .filter(Boolean)
          .slice(0, 15);

        setRecommended(validResults);
      } catch (err) {
        console.error("TMDB fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || recommended.length === 0) return;

    let animationId;
    const scroll = () => {
      container.scrollLeft = (container.scrollLeft + 1) % (container.scrollWidth / 2);
      animationId = requestAnimationFrame(scroll);
    };

    const pause = () => cancelAnimationFrame(animationId);
    const resume = () => scroll();

    container.addEventListener("mouseenter", pause);
    container.addEventListener("mouseleave", resume);

    scroll();

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener("mouseenter", pause);
      container.removeEventListener("mouseleave", resume);
    };
  }, [recommended]);

  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold mb-4">🎯 Recommended For You</h2>

      {loading ? (
        <p className="text-sm text-gray-400">Loading recommendations...</p>
      ) : recommended.length === 0 ? (
        <p className="text-sm text-gray-400">No recommendations found.</p>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar pb-2"
        >
          {[...recommended, ...recommended].map((movie, index) => (
            <MovieCard
              key={`${movie.id}_${index}`}
              id={movie.id}
              title={movie.title}
              imageUrl={movie.imageUrl}
              publicRating={movie.rating}
              isTV={movie.isTV}
              genres={movie.genres}
              language={movie.language}
              size="small"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Recommended;

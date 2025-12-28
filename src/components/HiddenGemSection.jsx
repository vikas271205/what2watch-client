import { useEffect, useState, useRef } from "react";
import MovieCard from "./MovieCard";
import ShimmerList from "./ShimmerLIst";
import { fetchHiddenGems } from "../api/tmdb";
import { fetchOMDbData } from "../api/omdb";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import genreMap from "../utils/GenreMap";

export default function HiddenGemSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      try {
        const raw = await fetchHiddenGems();
        if (!mounted) return;

        // Safety filters
        const filtered = raw
          .filter(i => i.poster_path && i.hiddenGemScore)
          .slice(0, 15);

        const enriched = await Promise.all(
          filtered.map(async (item) => {
            try {
              const title =
                item.type === "tv" ? item.title : item.title;

              const year =
                item.type === "tv"
                  ? item.first_air_date?.slice(0, 4)
                  : item.release_date?.slice(0, 4);

              const omdb = await fetchOMDbData(title, year);

              // IMDb
              let imdbNum = null;
              if (omdb?.imdbRating && omdb.imdbRating !== "N/A") {
                imdbNum = parseFloat(omdb.imdbRating);
              }

              // Rotten Tomatoes
              let rtValue = null;
              const rtItem = omdb?.Ratings?.find(
                r => r.Source === "Rotten Tomatoes"
              );
              if (rtItem?.Value) rtValue = rtItem.Value;

              const genreNames = (item.genre_ids || [])
                .map(id => genreMap[id])
                .filter(Boolean);

              return {
                id: item.id,
                title,
                year,
                imageUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`,

                tmdbRating: item.vote_average ?? null,
                imdbRating: imdbNum,
                rtRating: rtValue,
                popularity: item.popularity ?? 0,
                voteCount: item.vote_count ?? 0,
                genres: genreNames,

                isTV: item.type === "tv",
              };
            } catch {
              return null;
            }
          })
        );

        if (mounted) {
          setItems(enriched.filter(Boolean));
        }
      } catch (err) {
        console.error("[HiddenGemSection] Load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "left" ? -el.offsetWidth : el.offsetWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative group mt-10">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="text-amber-500" size={24} />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Hidden Gems
        </h2>
      </div>

      {loading ? (
        <ShimmerList count={6} />
      ) : (
        <div className="relative">
          <div
            ref={scrollRef}
            className="grid grid-flow-col auto-cols-[calc(100%/2.4)] sm:auto-cols-[calc(100%/3.4)] lg:auto-cols-[calc(100%/5.4)] gap-4 overflow-x-auto no-scrollbar py-4"
          >
            {items.map((item) => (
              <MovieCard key={`${item.isTV ? "tv" : "m"}-${item.id}`} {...item} />
            ))}
          </div>

          <button
            onClick={() => scroll("left")}
            className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-4 bg-white/80 dark:bg-white/10 p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={() => scroll("right")}
            className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4 bg-white/80 dark:bg-white/10 p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}


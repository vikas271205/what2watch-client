import { useEffect, useState, useRef } from "react";
import MovieCard from "./MovieCard";
import { fetchHiddenGems } from "../api/tmdb";
import { fetchOMDbData } from "../api/omdb";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import genreMap from "../utils/GenreMap";

export default function HiddenGemSection() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef();

  useEffect(() => {
    console.log("[HiddenGemSection] Mounted");

    const load = async () => {
      try {
        const raw = await fetchHiddenGems();
        console.log("[HiddenGemSection] Raw results:", raw.length);

        const filtered = raw.filter(m => m.poster_path);
        console.log("[HiddenGemSection] Filtered poster count:", filtered.length);

        const sliced = filtered.slice(0, 15);
        console.log("[HiddenGemSection] Using first 15 items");

const enriched = await Promise.all(
  sliced.map(async (m) => {
    try {
      const omdb = await fetchOMDbData(
        m.title,
        m.release_date?.slice(0, 4)
      );

      // --- PROPER IMDb extraction ---
      let imdbNum = null;
      if (omdb?.imdbRating && omdb.imdbRating !== "N/A") {
        imdbNum = parseFloat(omdb.imdbRating); // "7.8/10" becomes 7.8
      }

      // --- PROPER Rotten Tomatoes extraction ---
      let rtValue = null;
      const rtItem = omdb?.Ratings?.find(
        (r) => r.Source === "Rotten Tomatoes"
      );
      if (rtItem?.Value) {
        rtValue = rtItem.Value; // Example: "92%"
      }

      // --- Convert TMDB genre_ids → names ---
      const genreNames = (m.genre_ids || [])
        .map((id) => genreMap[id])
        .filter(Boolean);

      return {
        id: m.id,
        title: m.title,
        year: m.release_date?.slice(0, 4),
        imageUrl: `https://image.tmdb.org/t/p/w500${m.poster_path}`,

        // REQUIRED FOR SCORING
        tmdbRating: m.vote_average ?? null,
        imdbRating: imdbNum,
        rtRating: rtValue,
        popularity: m.popularity ?? 0,
        voteCount: m.vote_count ?? 0,
        genres: genreNames,

        isTV: false,
      };
    } catch (err) {
      console.error("[HiddenGem] OMDB failed:", m.title, err);
      return null;
    }
  })
);



        const valid = enriched.filter(Boolean);
        console.log("[HiddenGemSection] Enriched movies:", valid.length);

        setMovies(valid);
      } catch (err) {
        console.error("[HiddenGemSection] Error loading Hidden Gems:", err);
      }

      setLoading(false);
    };

    load();
  }, []);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;

    const amt = el.offsetWidth;
    el.scrollBy({
      left: direction === "left" ? -amt : amt,
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
        <div className="grid grid-flow-col auto-cols-[calc(100%/2.4)] sm:auto-cols-[calc(100%/3.4)] lg:auto-cols-[calc(100%/5.4)] gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="relative">
          <div
            ref={scrollRef}
            className="grid grid-flow-col auto-cols-[calc(100%/2.4)] sm:auto-cols-[calc(100%/3.4)] lg:auto-cols-[calc(100%/5.4)] gap-4 overflow-x-auto no-scrollbar py-4"
          >
            {movies.map((m) => (
              <MovieCard key={m.id} {...m} />
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

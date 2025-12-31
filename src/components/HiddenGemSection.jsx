import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { fetchHiddenGems } from "../api/tmdb";
import { fetchOMDbData } from "../api/omdb";
import genreMap from "../utils/GenreMap";
import HiddenGemFeaturedCard from "./HiddenGemFeaturedCard";
import HiddenGemCompactCard from "./HiddenGemCompactCard";
import ShimmerList from "./ShimmerLIst";

export default function HiddenGemsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const raw = await fetchHiddenGems();

        const filtered = raw
          .filter(i => i.poster_path)
          .slice(0, 10);

        const enriched = await Promise.all(
          filtered.map(async (item) => {
            const year =
              item.type === "tv"
                ? item.first_air_date?.slice(0, 4)
                : item.release_date?.slice(0, 4);

            const omdb = await fetchOMDbData(item.title, year);

            const genreNames = (item.genre_ids || [])
              .map(id => genreMap[id])
              .filter(Boolean);

            return {
              id: item.id,
              title: item.title,
              year,
              overview: item.overview,
              imageUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
              tmdbRating: item.vote_average ?? null,
              genres: genreNames,
              isTV: item.type === "tv",
            };
          })
        );

        if (mounted) setItems(enriched);
      } catch (err) {
        console.error("[HiddenGems] error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => (mounted = false);
  }, []);

  if (loading) return <ShimmerList count={6} />;
  if (!items.length) return null;

  const featured = items.slice(0, 3);
  const compact = items.slice(3, 10);

  return (
    <section className="mt-14">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="text-amber-500" size={22} />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Hidden Gems
        </h2>
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-3 gap-6">
          {featured.map((item, i) => (
            <HiddenGemFeaturedCard
              key={item.id}
              rank={i + 1}
              {...item}
            />
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4 mt-6">
          {compact.map((item, i) => (
            <HiddenGemCompactCard
              key={item.id}
              rank={i + 4}
              {...item}
            />
          ))}
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden space-y-4">
        {items.slice(0, 4).map((item, i) => (
          <HiddenGemCompactCard
            key={item.id}
            rank={i + 1}
            {...item}
          />
        ))}
      </div>
    </section>
  );
}

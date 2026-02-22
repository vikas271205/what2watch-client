import { useEffect, useMemo, useState } from "react";
import API_BASE from "../utils/api";
import genreMap from "../utils/GenreMap";
import languageMap from "../utils/LanguageMap";
import useAdminClaim from "../hooks/useAdminClaim";
import { auth } from "../firebase";
import MovieCard from "../components/MovieCard";
import { SlidersHorizontal, X } from "lucide-react";

export default function UnclesPick() {
  const [items, setItems] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [sortOption, setSortOption] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(18);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { isAdmin } = useAdminClaim();

  /* ------------------ Dynamic Accent ------------------ */
  useEffect(() => {
    const palette = [
      "#7f1d1d",
      "#831843",
      "#581c87",
      "#9a3412",
      "#7c2d12",
      "#4c1d95",
    ];
    const random = palette[Math.floor(Math.random() * palette.length)];
    document.documentElement.style.setProperty("--accent", random);
  }, []);

  /* ------------------ Fetch ------------------ */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/recommend/all`);
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error(err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ------------------ Helpers ------------------ */
  const getTime = (item) => {
    if (!item.createdAt) return 0;
    if (item.createdAt.seconds) return item.createdAt.seconds * 1000;
    if (item.createdAt instanceof Date) return item.createdAt.getTime();
    if (typeof item.createdAt === "number") return item.createdAt;
    return 0;
  };

  const filteredItems = useMemo(() => {
    let list = [...items];

    if (selectedType !== "all") {
      if (selectedType === "animation") {
        list = list.filter((i) =>
          i.genre_ids?.map(Number).includes(16)
        );
      } else {
        list = list.filter((i) => i.type === selectedType);
      }
    }

    if (selectedGenre) {
      const genreId = parseInt(selectedGenre);
      list = list.filter(
        (i) => i.genre_ids?.map(Number).includes(genreId)
      );
    }

    if (selectedLanguage) {
      list = list.filter((i) => i.language === selectedLanguage);
    }

    list.sort((a, b) => {
      if (sortOption === "highest")
        return (b.rating || 0) - (a.rating || 0);
      if (sortOption === "lowest")
        return (a.rating || 0) - (b.rating || 0);

      const timeA = getTime(a);
      const timeB = getTime(b);

      if (sortOption === "latest") return timeB - timeA;
      if (sortOption === "oldest") return timeA - timeB;
      return 0;
    });

    return list;
  }, [items, selectedType, selectedGenre, selectedLanguage, sortOption]);

  const resetFilters = () => {
    setSelectedGenre("");
    setSelectedLanguage("");
    setSelectedType("all");
    setSortOption("latest");
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(
        `${API_BASE}/api/recommend/${item.type}_${item.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await res.json();
      if (result.success) {
        setItems((prev) =>
          prev.filter(
            (i) => `${i.type}_${i.id}` !== `${item.type}_${item.id}`
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ------------------ Premium Filter UI ------------------ */
  const FilterBar = () => (
    <div className="flex flex-wrap gap-4 items-center">

      {/* Type Chips */}
      <div className="flex gap-3 flex-wrap">
        {["all", "movie", "tv", "animation"].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-5 py-2 rounded-full border transition-all duration-300 ${
              selectedType === type
                ? "text-white"
                : "bg-white/5 border-white/10 hover:border-white/30"
            }`}
            style={
              selectedType === type
                ? { backgroundColor: "var(--accent)" }
                : {}
            }
          >
            {type.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Genre */}
      <select
        value={selectedGenre}
        onChange={(e) => setSelectedGenre(e.target.value)}
        className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md"
      >
        <option value="">All Genres</option>
        {Object.entries(genreMap).map(([id, name]) => (
          <option key={id} value={id}>{name}</option>
        ))}
      </select>

      {/* Language */}
      <select
        value={selectedLanguage}
        onChange={(e) => setSelectedLanguage(e.target.value)}
        className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md"
      >
        <option value="">All Languages</option>
        {Array.from(new Set(items.map(i => i.language).filter(Boolean)))
          .sort()
          .map((lang) => (
            <option key={lang} value={lang}>
              {languageMap[lang] || lang.toUpperCase()}
            </option>
          ))}
      </select>

      {/* Sort */}
      <select
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value)}
        className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md"
      >
        <option value="latest">Latest</option>
        <option value="oldest">Oldest</option>
        <option value="highest">Highest Rated</option>
        <option value="lowest">Lowest Rated</option>
      </select>

      <button
        onClick={resetFilters}
        className="px-5 py-2 rounded-xl bg-white text-black font-semibold"
      >
        Reset
      </button>
    </div>
  );

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "linear-gradient(to bottom, var(--accent), black 35%)",
      }}
    >
      {/* Title */}
      <div className="max-w-screen-xl mx-auto px-6 pt-20 pb-10">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight">
          UNCLE'S PICK
        </h1>
      </div>

      {/* Filters */}
      <div className="max-w-screen-xl mx-auto px-6 pb-8">
        <FilterBar />
      </div>

      {/* Grid */}
      <div className="max-w-screen-xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            Loading titles...
          </div>
        ) : filteredItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
              {filteredItems.slice(0, displayLimit).map((item) => (
                <div
                  key={`${item.type}_${item.id}`}
                  className="transform hover:scale-105 transition duration-300"
                >
                  <MovieCard
                    id={item.id}
                    title={item.title}
                    imageUrl={item.poster}
                    tmdbRating={item.tmdbRating}
                    imdbRating={item.imdbRating}
                    rtRating={item.rtRating}
                    genres={item.genre_ids?.map((id) => genreMap[id])}
                    year={item.year}
                    type={item.type}
                    isTV={item.type === "tv"}
                    showUncleScore
                    isAdmin={isAdmin}
                    showRemoveButton={isAdmin}
                    onDelete={() => handleDelete(item)}
                  />
                </div>
              ))}
            </div>

            {displayLimit < filteredItems.length && (
              <div className="text-center mt-14">
                <button
                  onClick={() => setDisplayLimit((p) => p + 18)}
                  className="px-8 py-3 rounded-xl font-semibold"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  Load More
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-gray-400">
            No titles match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
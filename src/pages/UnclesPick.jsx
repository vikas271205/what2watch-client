import { useEffect, useState } from "react";
import API_BASE from "../utils/api";
import genreMap from "../utils/GenreMap";
import languageMap from "../utils/LanguageMap";
import useAdminClaim from "../hooks/useAdminClaim";
import { auth } from "../firebase";
import MovieCard from "../components/MovieCard";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, ChevronDown, X } from "lucide-react";

// --- The entire logic section below is IDENTICAL to your original code ---

export default function UnclesPick() {
  const [items, setItems] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [sortOption, setSortOption] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(12);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false); // New state for modal
  const { isAdmin } = useAdminClaim();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/recommend/all`);
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error("Failed to load UNCLE's PICK:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const applyFilters = (list) => {
    return list
      .filter((item) => {
        if (selectedType === 'all') return true;
        if (selectedType === 'movie') return item.type === 'movie' && !item.genre_ids?.includes(16);
        if (selectedType === 'tv') return item.type === 'tv' && !item.genre_ids?.includes(16);
        if (selectedType === 'animation') return item.genre_ids?.includes(16);
        return true;
      })
      .filter((item) => (selectedGenre ? item.genre_ids?.includes(parseInt(selectedGenre)) : true))
      .filter((item) => (selectedLanguage ? item.language === selectedLanguage : true))
      .sort((a, b) => {
        if (sortOption === "highest") return b.rating - a.rating;
        if (sortOption === "lowest") return a.rating - b.rating;
        if (sortOption === "latest") {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        }
        if (sortOption === "oldest") {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateA - dateA;
        }
        return 0;
      });
  };
  
const [enrichedItems, setEnrichedItems] = useState([]);

useEffect(() => {
  const enrich = async () => {
    if (!items.length) {
      setEnrichedItems([]);
      return;
    }

    const enriched = await Promise.all(
      items.map(async (item) => {
        const title = item.title;
        const year = item.year || item.release_date?.slice(0, 4);

        let imdbRating = null;
        let rtRating = null;

        try {
          // const omdb = await fetch(
          //   `${API_BASE}/api/omdb?title=${encodeURIComponent(title)}&year=${year}`
          // ).then((r) => r.json());

          // imdbRating =
          //   omdb?.Ratings?.find((r) => r.Source === "Internet Movie Database")
          //     ?.Value?.split("/")[0] || null;

          // rtRating =
          //   omdb?.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value ||
          //   null;
        } catch (e) {
          console.error("OMDb failed:", e);
        }

        return {
          ...item,
          tmdbRating: item.tmdbRating || item.rating,
          imdbRating,
          rtRating,
          popularity: item.popularity || 0,
          voteCount: item.vote_count || 50, // safe fallback
          genres: item.genre_ids?.map((id) => genreMap[id]) || [],
          year,
          imageUrl: item.poster,
        };
      })
    );

    setEnrichedItems(enriched);
  };

  enrich();
}, [items]);

const filteredEnrichedItems = applyFilters(enrichedItems);

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${API_BASE}/api/recommend/${item.type}_${item.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success) {
            alert("Deleted successfully.");
            setItems((prev) => prev.filter((i) => `${i.type}_${i.id}` !== `${item.type}_${i.id}`));
        } else {
            throw new Error(result.error || "Failed to delete");
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
  };

  // --- Start of New UI ---

  const CustomSelect = ({ value, onChange, options, placeholder }) => (
    <div className="relative w-full">
      <select
        value={value}
        onChange={onChange}
        className="appearance-none w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
      >
        <option value="">{placeholder}</option>
        {options}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown size={20} className="text-gray-400" />
      </div>
    </div>
  );

  const FilterModal = () => (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsFilterModalOpen(false)} />
      <motion.div
        className="relative bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-lg space-y-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Filter & Sort</h2>
          <button onClick={() => setIsFilterModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomSelect
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                placeholder="All Types"
                options={<><option value="all">All Types</option><option value="movie">Movies</option><option value="tv">TV Shows</option><option value="animation">Animation</option></>}
            />
            <CustomSelect
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                placeholder="Sort By"
                options={<><option value="latest">Latest Added</option><option value="highest">Highest Rated</option><option value="lowest">Lowest Rated</option><option value="oldest">Oldest Added</option></>}
            />
            <CustomSelect
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                placeholder="All Genres"
                options={Object.entries(genreMap).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            />
            <CustomSelect
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                placeholder="All Languages"
                options={Array.from(new Set(items.map(i => i.language).filter(Boolean))).map((lang) => <option key={lang} value={lang}>{languageMap[lang] || lang.toUpperCase()}</option>)}
            />
        </div>
        <button 
            onClick={() => setIsFilterModalOpen(false)}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors"
        >
            Done
        </button>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AnimatePresence>
        {isFilterModalOpen && <FilterModal />}
      </AnimatePresence>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Uncle's Pick</h1>
            <p className="text-gray-400 mt-2">A gallery of curated titles.</p>
          </div>
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-gray-800 border border-gray-700 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            <SlidersHorizontal size={16} />
            Filter
          </button>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-10">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredEnrichedItems.length > 0 ? (
          <>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-10"
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
              initial="hidden"
              animate="show"
            >
              {filteredEnrichedItems.slice(0, displayLimit).map((item) => {
                const isTV = item.type === 'tv' || item.genre_ids?.includes(16);
                return (
                  <motion.div
                    key={`${item.type}_${item.id}`}
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    className="relative"
                  >
<MovieCard
  id={item.id}
  title={item.title}
  imageUrl={item.imageUrl}
  tmdbRating={item.tmdbRating}
  imdbRating={null}
  rtRating={null}
  popularity={item.popularity}
  voteCount={item.voteCount}
  genres={item.genres}
  year={item.year}
  type={item.type}
  isTV={isTV}
  showUncleScore={true}
  isAdmin={isAdmin}
  showRemoveButton={isAdmin}
  onDelete={() => handleDelete(item)}
/>

                  </motion.div>
                );
              })}
            </motion.div>
            {displayLimit < filteredEnrichedItems.length && (
              <div className="text-center pt-12">
                <motion.button
                  onClick={() => setDisplayLimit(prev => prev + 12)}
                  className="px-8 py-3 rounded-xl bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Load More
                </motion.button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-2xl font-bold text-white">No Titles Match Your Filters</h3>
            <p className="mt-2 text-gray-400">Try adjusting your filter settings to see more recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
}

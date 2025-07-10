import { useEffect, useState, useRef } from "react";
import API_BASE from "../utils/api";
import genreMap from "../utils/GenreMap";
import languageMap from "../utils/LanguageMap";
import useAdminClaim from "../hooks/useAdminClaim";
import { auth } from "../firebase";
import MovieCard from "../components/MovieCard";
import { motion } from "framer-motion";

export default function UnclesPick() {
  const [items, setItems] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [sortOption, setSortOption] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [movieLimit, setMovieLimit] = useState(8);
  const [tvLimit, setTvLimit] = useState(8);
  const [animationLimit, setAnimationLimit] = useState(8);
  const { isAdmin } = useAdminClaim();
  const canvasRef = useRef(null);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.opacity = "0.15";
    const particles = [];

    function createParticle(x, y) {
      particles.push({ x, y, opacity: 1, radius: 6 });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`;
        ctx.fill();
        ctx.closePath();
        p.opacity -= 0.015;
        if (p.opacity <= 0) particles.splice(i, 1);
      });
      requestAnimationFrame(animate);
    }

    document.addEventListener("mousemove", (e) => createParticle(e.clientX, e.clientY));
    animate();
    return () => document.removeEventListener("mousemove", createParticle);
  }, []);

  const applyFilters = (list) => {
    return list
      .filter((item) => (selectedGenre ? item.genre_ids?.includes(parseInt(selectedGenre)) : true))
      .filter((item) => (selectedLanguage ? item.language === selectedLanguage : true))
      .sort((a, b) => {
        if (sortOption === "highest") return b.rating - a.rating;
        if (sortOption === "lowest") return a.rating - b.rating;
        if (sortOption === "latest") return b.createdAt - a.createdAt;
        if (sortOption === "oldest") return a.createdAt - b.createdAt;
        return 0;
      });
  };

  const movies = selectedType === "tv" || selectedType === "animation"
    ? []
    : applyFilters(items.filter((item) => item.type === "movie" && !item.genre_ids?.includes(16)));

  const tvShows = selectedType === "movie" || selectedType === "animation"
    ? []
    : applyFilters(items.filter((item) => item.type === "tv" && !item.genre_ids?.includes(16)));

  const animations = selectedType === "movie" || selectedType === "tv"
    ? []
    : applyFilters(items.filter((item) => item.genre_ids?.includes(16)));

  const handleDelete = async (item) => {
    const confirm = window.confirm(`Delete "${item.title}"?`);
    if (!confirm) return;
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`${API_BASE}/api/recommend/${item.type}_${item.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();
    if (result.success) {
      alert("Deleted successfully.");
      setItems((prev) => prev.filter((i) => `${i.type}_${i.id}` !== `${item.type}_${item.id}`));
    } else {
      alert(`Error: ${result.error || "Failed to delete"}`);
    }
  };

  const renderSection = (title, data, limit, setLimit, isTV) => (
    data.length > 0 && (
      <>
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-6"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        >
          {data.slice(0, limit).map((item) => (
            <motion.div
              key={`${item.type}_${item.id}`}
              variants={{
                hidden: { opacity: 0, scale: 0.9, y: 20 },
                show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } },
              }}
              whileHover={{ scale: 1.03 }}
            >
              <MovieCard
                id={item.id}
                title={item.title}
                imageUrl={item.poster}
                tmdbRating={item.tmdbRating || item.rating?.toString()}
                imdbRating={item.imdbRating}
                rtRating={item.rtRating}
                type={item.type}
                year={item.year}
                language={item.language}
                genres={(item.genre_ids || []).map((id) => genreMap[id]).filter(Boolean)}
                isTV={isTV}
                isAdmin={isAdmin}
                showRemoveButton={isAdmin}
                showUncleScore={true}
                onDelete={isAdmin ? () => handleDelete(item) : null}
              />
            </motion.div>
          ))}
        </motion.div>
        {data.length > limit && (
          <div className="text-center mb-10">
            <button
              onClick={() => setLimit(limit + 8)}
              className="px-6 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              Load More
            </button>
          </div>
        )}
      </>
    )
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-black text-black dark:text-white pt-20">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto relative z-10">
        <motion.h1
          className="text-4xl sm:text-5xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-600"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          🎯 UNCLE's PICK
        </motion.h1>

        {/* Filters */}
        <motion.div
          className="flex flex-wrap gap-4 mb-8 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800"
          >
            <option value="all">All Types</option>
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
            <option value="animation">Animation</option>
          </motion.select>

          <motion.select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800"
          >
            <option value="">All Genres</option>
            {Object.entries(genreMap).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </motion.select>

          <motion.select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800"
          >
            <option value="">All Languages</option>
            {Array.from(new Set(items.map(i => i.language).filter(Boolean))).map((lang) => (
              <option key={lang} value={lang}>
                {languageMap[lang] || lang.toUpperCase()}
              </option>
            ))}
          </motion.select>

          <motion.select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800"
          >
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
            <option value="latest">Latest Added</option>
            <option value="oldest">Oldest Added</option>
          </motion.select>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[280px] bg-gray-300 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {renderSection("🎬 Movies", movies, movieLimit, setMovieLimit, false)}
            {renderSection("📺 TV Shows", tvShows, tvLimit, setTvLimit, true)}
            {renderSection("🎨 Animation", animations, animationLimit, setAnimationLimit, true)}
          </>
        )}
      </div>
    </div>
  );
}

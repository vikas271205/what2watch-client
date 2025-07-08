import { useEffect, useState, useRef } from "react";
import API_BASE from "../utils/api";
import genreMap from "../utils/GenreMap";
import useAdminClaim from "../hooks/useAdminClaim";
import { auth } from "../firebase";
import MovieCard from "../components/MovieCard";
import { motion } from "framer-motion";

export default function UnclesPick() {
  const [items, setItems] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAdminClaim();
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/recommend/all`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
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

  const filtered = items
    .filter((item) => (selectedGenre ? item.genre_ids?.includes(parseInt(selectedGenre)) : true))
    .filter((item) => item.rating >= minRating)
    .sort((a, b) => sortOrder === "desc" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);

  const movies = filtered.filter((i) => i.type === "movie" && !i.genre_ids?.includes(16));
  const tvshows = filtered.filter((i) => i.type === "tv" && !i.genre_ids?.includes(16));
  const animation = filtered.filter((i) => i.genre_ids?.includes(16));

  const sections = [
    { title: "🎬 Movies", data: movies },
    { title: "📺 TV Shows", data: tvshows },
    { title: "✨ Animation", data: animation },
  ];

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
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-300 dark:hover:bg-gray-700"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <option value="">All Genres</option>
          {Object.entries(genreMap).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </motion.select>

        <motion.input
          type="number"
          min="0"
          max="10"
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          placeholder="Min Rating"
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-300 dark:hover:bg-gray-700 w-28"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />

        <motion.select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-300 dark:hover:bg-gray-700"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </motion.select>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-[280px] bg-gray-300 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        sections.map((section) => (
          <div key={section.title} className="mb-12">
            <motion.h2
              className="text-2xl sm:text-3xl font-semibold mb-4 text-purple-600 dark:text-purple-300"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {section.title}
            </motion.h2>

            {section.data.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center">No items found.</p>
            ) : (
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
              >
                {section.data.map((item) => (
                  <motion.div
                    key={`${item.type}_${item.id}`}
                    variants={{
                      hidden: { opacity: 0, scale: 0.9, y: 20 },
                      show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } },
                    }}
                    whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
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
                      isTV={item.type === "tv"}
                      isAdmin={isAdmin}
                      showRemoveButton={false}
                      showUncleScore={true}
                      onDelete={
                        isAdmin
                          ? async () => {
                              const confirm = window.confirm(`Delete "${item.title}"?`);
                              if (!confirm) return;
                              const user = auth.currentUser;
                              const token = await user.getIdToken();
                              const res = await fetch(`${API_BASE}/api/recommend/${item.type}_${item.id}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              const result = await res.json();
                              if (result.success) {
                                alert("Deleted successfully.");
                                setItems((prev) =>
                                  prev.filter((i) => `${i.type}_${i.id}` !== `${item.type}_${item.id}`)
                                );
                              } else {
                                alert(`Error: ${result.error || "Failed to delete"}`);
                              }
                            }
                          : null
                      }
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        ))
      )}
    </div>

    <style>
      {`
        .scrollbar-thin::-webkit-scrollbar {
          height: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #6366f1;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background-color: #1f2937;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out; }
        .animate-zoomIn { animation: zoomIn 0.5s ease-out; }
      `}
    </style>
  </div>
);

}
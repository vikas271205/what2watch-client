import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API_BASE from "../utils/api";
import ShimmerCard from "./ShimmerCard";

function HeroSection() {
  const [heroMovie, setHeroMovie] = useState(null);
  const [query, setQuery] = useState("");
  const [aiOverview, setAiOverview] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHeroMovie = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/recommend/all`);
        const data = await res.json();

const validItems = data.filter(
  (item) =>
    typeof item.poster === "string" && item.poster.startsWith("http")
);

const randomItem = validItems[Math.floor(Math.random() * validItems.length)];
       if (!randomItem) return;

        // ✅ Correct
const fullRes = await fetch(`${API_BASE}/api/tmdb/${randomItem.type}/${randomItem.id}`);


        const fullMovie = await fullRes.json();

        // Fetch AI rewritten overview
        let rewritten = "";
        try {
          const aiRes = await fetch(`${API_BASE}/api/ai/rewrite-overview`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: fullMovie.title,
              overview: fullMovie.overview,
              genre: fullMovie.genres?.[0]?.name || "Movie",
              type: "movie",
              year: fullMovie.release_date?.slice(0, 4),
            }),
          });

          const aiData = await aiRes.json();
          if (aiData?.rewritten) {
            rewritten = aiData.rewritten;
          } else {
            console.warn("Fallback to original overview");
            rewritten = fullMovie.overview;
          }
        } catch (err) {
          console.warn("AI overview error:", err.message);
          rewritten = fullMovie.overview;
        }

        setHeroMovie({
          ...randomItem,
          overview: fullMovie.overview,
          backdrop_path: fullMovie.backdrop_path,
          genres: fullMovie.genres || [],
        });

        setAiOverview(rewritten);
      } catch (err) {
        console.error("Hero movie fetch failed:", err);
        setHeroMovie(null);
      }
    };

    fetchHeroMovie();
  }, []);

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleGenreClick = (genreName) => {
    navigate(`/genres?name=${encodeURIComponent(genreName)}`);
  };

  if (!heroMovie) {
    return (
      <div className="relative h-[60vh] flex items-center justify-center bg-gradient-to-br from-gray-900 to-indigo-900 font-inter">
        <ShimmerCard type="text-block" className="w-full max-w-4xl" />
      </div>
    );
  }

  return (
    <div className="relative font-inter">
      <div
        className="relative h-[60vh] flex items-center justify-center text-center px-4 bg-cover bg-center before:absolute before:inset-0 before:bg-black/10 before:rounded-md"


style={{
  backgroundImage: `url(https://image.tmdb.org/t/p/original${heroMovie.backdrop_path})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  zIndex: 0,
  filter: "brightness(0.75) saturate(1.2)",
}}



      >
        {/* Dark overlay with increased opacity */}
        <div className="absolute inset-0 bg-black/10 sm:bg-black/20 backdrop-blur-[1px] sm:backdrop-blur-[2px]" />




        {/* Content */}
        <div className="relative z-10 text-white w-full max-w-5xl space-y-5 sm:space-y-7 animate-slideInUp">
<h1 className="text-3xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight text-shadow-sm drop-shadow-[0_2px_30px_rgba(255,255,255,0.35)] bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent animate-fadeInUp">
  {heroMovie.title}
</h1>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 px-2">
            {heroMovie.genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleGenreClick(genre.name)}
                className="text-xs sm:text-sm px-4 sm:px-5 py-2 bg-gradient-to-r from-purple-500/80 to-indigo-500/80 border border-white/30 text-white rounded-full transition-all duration-300 hover:from-purple-400 hover:to-indigo-400 hover:scale-110 hover:shadow-2xl"
              >
                {genre.name}
              </button>
            ))}
          </div>

<div className="text-center space-y-3 px-4">
  <div className="inline-block relative">
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-yellow-400 to-purple-600 blur-md opacity-70 animate-pulse" />
<p className="relative z-10 text-sm sm:text-base font-bold text-white uppercase tracking-wider px-5 py-2 rounded-full bg-black/70 backdrop-blur-md shadow-xl border border-white/20">
  🎬 Uncle's Cinematic Gem – Just for You!
</p>

  </div>

  <p className="text-sm sm:text-base md:text-lg text-white/90 px-4 sm:px-6 line-clamp-3 max-w-2xl sm:max-w-3xl mx-auto font-medium drop-shadow-lg">
    {aiOverview || "Uncle recommends this as a must-watch!"}
  </p>
</div>



          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 px-2">
            <Link
              to={`/movie/${heroMovie.id}`}
              className="px-5 sm:px-8 py-3 bg-gradient-to-r from-teal-300 to-cyan-400 hover:from-teal-400 hover:to-cyan-500 rounded-full text-white font-bold text-sm sm:text-lg shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-[0_0_25px_rgba(0,255,255,0.6)]"
            >
              🎬 More Details
            </Link>

            <div className="flex w-full max-w-xs sm:max-w-md">
              <input
                type="text"
                placeholder="Search movies or shows..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="px-4 sm:px-6 py-3 w-full rounded-l-full bg-white/10 text-white placeholder-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-teal-300 border border-white/30 transition-all duration-300"
              />
              <button
                onClick={handleSearch}
                className="px-4 sm:px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 rounded-r-full text-white font-bold text-sm sm:text-base shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-[0_0_25px_rgba(255,105,180,0.6)]"
              >
                🔍
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;
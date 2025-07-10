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

        const validMovies = data.filter(
          (item) =>
            item.type === "movie" &&
            typeof item.poster === "string" &&
            item.poster.startsWith("http")
        );

        const randomMovie = validMovies[Math.floor(Math.random() * validMovies.length)];
        if (!randomMovie) return;

        const fullRes = await fetch(`${API_BASE}/api/tmdb/movie/${randomMovie.id}`);
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
          ...randomMovie,
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
        className="relative h-[60vh] flex items-center justify-center text-center px-4 bg-contain bg-top animate-zoomFade transition-all duration-500"
        style={{
          backgroundImage: `url(https://image.tmdb.org/t/p/original${heroMovie.backdrop_path})`,
          zIndex: 0,
        }}
      >
        {/* Dark overlay with increased opacity */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />

        {/* Tagline - mobile, moved further down to avoid navbar */}
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 sm:hidden z-20">
          <div className="inline-block text-[11px] font-semibold tracking-wide text-white bg-gradient-to-r from-pink-500 to-orange-500 px-3 py-1.5 rounded-full shadow-2xl border border-white/20 transition-transform hover:scale-110">
            🔥 Uncle's Cinematic Gem – Just for You!
          </div>
        </div>

        {/* Tagline - desktop */}
        <div className="hidden sm:block absolute top-12 left-8 z-20">
          <div className="text-lg font-bold tracking-wider text-white bg-gradient-to-r from-pink-500 to-orange-500 px-8 py-3 rounded-full shadow-2xl border border-white/30 transition-transform hover:scale-105">
            🔥 Uncle's Cinematic Gem – Just for You!
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-white w-full max-w-5xl space-y-5 sm:space-y-7 pt-24 sm:pt-16 animate-slideInUp">
          <h1 className="text-2xl sm:text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-200 via-cyan-300 to-pink-400 drop-shadow-2xl animate-pulseSlow">
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

          <p className="text-sm sm:text-base md:text-lg text-gray-50 px-4 sm:px-6 line-clamp-3 max-w-2xl sm:max-w-3xl mx-auto font-medium drop-shadow-lg">
            {aiOverview || "Uncle recommends this as a must-watch!"}
          </p>

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
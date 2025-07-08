import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API_BASE from "../utils/api";

function HeroSection() {
  const [heroMovie, setHeroMovie] = useState(null);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
const fetchHeroMovie = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/recommend/all`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    // Filter movies with a poster (just for visual)
    const validMovies = data.filter(
      (item) =>
        item.type === "movie" &&
        typeof item.poster === "string" &&
        item.poster.startsWith("http")
    );

    const pick = validMovies[0]; // or random

    if (!pick) {
      setHeroMovie(null);
      return;
    }

    // Fetch full movie data from TMDB using your backend
    const fullRes = await fetch(`${API_BASE}/api/tmdb/movie/${pick.id}`);
    if (!fullRes.ok) throw new Error(`Failed to get full TMDB data`);
    const fullMovie = await fullRes.json();

    setHeroMovie({
      ...pick,
      overview: fullMovie.overview,
      backdrop_path: fullMovie.backdrop_path,
    });
  } catch (err) {
    console.error("Hero movie fetch failed:", err);
    setHeroMovie(null);
  }
};


    fetchHeroMovie();
  }, []);

  const handleSearch = () => {
    if (query.trim() !== "") {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  if (!heroMovie) {
    return (
      <div className="relative h-[50vh] sm:h-[70vh] flex items-center justify-center bg-gray-900 font-inter">
        <div className="relative z-10 text-center max-w-3xl space-y-4">
          <div className="h-12 sm:h-16 w-3/4 mx-auto bg-gray-700/50 rounded-lg animate-pulseSlow"></div>
          <div className="space-y-2">
            <div className="h-4 sm:h-5 w-full mx-auto bg-gray-700/50 rounded animate-pulseSlow"></div>
            <div className="h-4 sm:h-5 w-5/6 mx-auto bg-gray-700/50 rounded animate-pulseSlow"></div>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <div className="h-10 w-full max-w-md bg-gray-700/50 rounded-lg animate-pulseSlow"></div>
            <div className="h-10 w-24 bg-gray-700/50 rounded-lg animate-pulseSlow"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-[50vh] sm:h-[70vh] flex items-center justify-center text-center px-4 sm:px-10 font-inter"
      style={{
        backgroundImage: `url(${heroMovie.poster})`,

        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlendMode: "overlay",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70 backdrop-blur-sm" />

      <div className="relative z-10 text-white max-w-3xl">
        {/* Subtitle */}
        <p className="text-sm sm:text-base text-purple-300 uppercase tracking-wider mb-2 animate-fadeIn">
          🎯 Uncle’s Favorite Pick
        </p>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-bold mb-4 animate-fadeIn">
          {heroMovie.title}
        </h1>

        {/* Overview fallback */}
        <p className="text-sm sm:text-lg text-gray-200 mb-6 line-clamp-3 animate-slideUp">
          {heroMovie.overview || "This is a must-watch handpicked by Uncle himself!"}
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-zoomIn">
<Link
  to={`/movie/${heroMovie.id}`}
  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
>
  📖 More Details
</Link>

          <div className="flex w-full max-w-md">
            <input
              type="text"
              placeholder="Search movies or shows..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="px-4 py-2 w-full rounded-l-lg bg-white/90 text-black focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-r-lg text-white font-semibold transition-colors duration-200"
            >
              Search
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default HeroSection;

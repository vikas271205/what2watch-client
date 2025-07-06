import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "";

function HeroSection() {
  const [heroMovie, setHeroMovie] = useState(null);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHeroMovie = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/trending?time=week`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        const topMovie =
          data
            ?.filter((item) => item.media_type === "movie" && item.backdrop_path)
            .sort(() => 0.5 - Math.random())[0] || null;

        setHeroMovie(topMovie);
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
          {/* Skeleton Title */}
          <div
            className="h-12 sm:h-16 w-3/4 mx-auto bg-gray-700/50 rounded-lg animate-pulseSlow"
            style={{ animationDelay: "0ms" }}
          ></div>
          {/* Skeleton Overview */}
          <div className="space-y-2">
            <div
              className="h-4 sm:h-5 w-full mx-auto bg-gray-700/50 rounded animate-pulseSlow"
              style={{ animationDelay: "200ms" }}
            ></div>
            <div
              className="h-4 sm:h-5 w-5/6 mx-auto bg-gray-700/50 rounded animate-pulseSlow"
              style={{ animationDelay: "400ms" }}
            ></div>
          </div>
          {/* Skeleton Search Bar and Button */}
          <div
            className="flex flex-col sm:flex-row justify-center items-center gap-4"
          >
            <div
              className="h-10 w-full max-w-md bg-gray-700/50 rounded-lg animate-pulseSlow"
              style={{ animationDelay: "600ms" }}
            ></div>
            <div
              className="h-10 w-24 bg-gray-700/50 rounded-lg animate-pulseSlow"
              style={{ animationDelay: "800ms" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-[50vh] sm:h-[70vh] flex items-center justify-center text-center px-4 sm:px-10 font-inter"
      style={{
        backgroundImage: `url(https://image.tmdb.org/t/p/original${heroMovie.backdrop_path})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlendMode: "overlay",
      }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70 backdrop-blur-sm" />

      <div className="relative z-10 text-white max-w-3xl">
        <h1 className="text-3xl sm:text-5xl font-bold mb-4 animate-fadeIn">
          {heroMovie.title}
        </h1>
        <p className="text-sm sm:text-lg text-gray-200 mb-6 line-clamp-3 animate-slideUp">
          {heroMovie.overview}
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-zoomIn">
          <Link
            to={`/movie/${heroMovie.id}`}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            🎬 Watch Now
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
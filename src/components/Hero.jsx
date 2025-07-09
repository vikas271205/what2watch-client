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

        setHeroMovie({
          ...randomMovie,
          overview: fullMovie.overview,
          backdrop_path: fullMovie.backdrop_path,
          genres: fullMovie.genres || [],
        });
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
      <div className="relative h-[60vh] flex items-center justify-center bg-gray-900 font-inter">
        <div className="text-white text-base sm:text-lg animate-pulseSlow">Fetching Uncle's pick...</div>
      </div>
    );
  }

  return (
<div className="relative font-inter">
  <div
    className="relative h-[60vh] flex items-center justify-center text-center px-4 bg-cover bg-center animate-zoomFade"
    style={{
      backgroundImage: `url(https://image.tmdb.org/t/p/original${heroMovie.backdrop_path})`,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 0,
    }}
  >
    {/* Dark overlay */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

    {/* Tagline - mobile */}
    <div className="absolute top-16 left-1/2 transform -translate-x-1/2 sm:hidden z-10">
      <div className="inline-block text-[11px] font-semibold tracking-wide text-white bg-gradient-to-r from-orange-500 to-red-600 px-3 py-1.5 rounded-full shadow-md border border-white/30">
        🔥 Handpicked by Uncle – Just for You!
      </div>
    </div>

    {/* Tagline - desktop */}
    <div className="hidden sm:block absolute top-24 left-6 z-20">
      <div className="text-base font-semibold tracking-wider text-white bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 rounded-full shadow-lg border border-white/40">
        🔥 Handpicked by Uncle – Just for You!
      </div>
    </div>

    {/* Content */}
    <div className="relative z-10 text-white w-full max-w-4xl space-y-4 sm:space-y-6 pt-20 sm:pt-12 animate-slideInUp">
      <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-500 drop-shadow-lg animate-fadeIn">
        {heroMovie.title}
      </h1>

      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-2">
        {heroMovie.genres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => handleGenreClick(genre.name)}
            className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            {genre.name}
          </button>
        ))}
      </div>

      <p className="text-xs sm:text-sm md:text-base text-gray-100 px-2 sm:px-4 line-clamp-3 max-w-2xl sm:max-w-3xl mx-auto">
        {heroMovie.overview || "Uncle recommends this as a must-watch!"}
      </p>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 px-2">
        <Link
          to={`/movie/${heroMovie.id}`}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 rounded-full text-white font-semibold text-sm sm:text-base shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
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
            className="px-3 sm:px-5 py-2 sm:py-3 w-full rounded-l-full bg-white/10 text-white placeholder-gray-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 border border-white/20"
          />
          <button
            onClick={handleSearch}
            className="px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 rounded-r-full text-white font-semibold text-sm sm:text-base shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
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

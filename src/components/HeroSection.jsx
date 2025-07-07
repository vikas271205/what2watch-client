import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_BASE from "../utils/api"; // adjust path if needed


function HeroSection() {
  const [backdrop, setBackdrop] = useState("");

  useEffect(() => {
    const fetchHeroMovie = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/trending?time=week`);
        const data = await res.json();
        const movie = data.find((item) => item.backdrop_path);
        if (movie) {
          setBackdrop(`https://image.tmdb.org/t/p/original${movie.backdrop_path}`);
        }
      } catch (err) {
        console.error("Failed to fetch hero backdrop:", err);
      }
    };

    fetchHeroMovie();
  }, []);

  return (
    <section
      className="relative w-full h-[75vh] flex items-center justify-center text-center px-4 text-white overflow-hidden"
      style={{
        backgroundImage: backdrop
          ? `url(${backdrop})`
          : "linear-gradient(to bottom right, #1c1c1c, #000)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-60" />

      <div className="relative z-10 max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 animate-fade-in">
          Discover What to Watch
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 mb-6 animate-slide-up">
          Explore trending movies, must-watch TV shows, and hidden gems.
        </p>
        <Link
          to="/trending"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition shadow-md"
        >
          Explore Now
        </Link>
      </div>
    </section>
  );
}

export default HeroSection;

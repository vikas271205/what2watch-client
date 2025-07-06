import { Link } from "react-router-dom";

function HeroSection() {
  return (
    <section className="relative w-full h-[75vh] flex items-center justify-center text-center px-4 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white overflow-hidden">
      {/* Optional animated glow or gradient blob */}
      <div className="absolute w-[500px] h-[500px] bg-blue-700 rounded-full opacity-20 blur-3xl animate-pulse top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />

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

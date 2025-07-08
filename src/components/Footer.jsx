import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 px-6 py-10 mt-20">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {/* Column 1: Logo + Intro */}
        <div>
          <h2 className="text-white text-2xl font-bold mb-3">🎬 UncleFilmFinder</h2>
          <p className="text-sm leading-relaxed">
            Your AI-powered guide to discovering trending movies, TV shows, and hidden gems.
          </p>
        </div>

        {/* Column 2: Navigation */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-3">Navigation</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/" className="hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link to="/trending" className="hover:text-white transition-colors">
                Trending
              </Link>
            </li>
            <li>
              <Link to="/watchlist" className="hover:text-white transition-colors">
                Watchlist
              </Link>
            </li>
            <li>
              <Link to="/search" className="hover:text-white transition-colors">
                Search
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Contact + Socials */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-3">Contact</h3>
          <p className="text-sm mb-2">📧 hello@unclefilmfinder.com</p>
          <div className="flex gap-4 mt-3">
            <a href="https://github.com/" target="_blank" rel="noopener noreferrer">
              <img src="/icons/github.svg" alt="GitHub" className="w-5 h-5 hover:opacity-80" />
            </a>
            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer">
              <img src="/icons/twitter.svg" alt="Twitter" className="w-5 h-5 hover:opacity-80" />
            </a>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 mt-10">
        © 2025 UncleFilmFinder. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;

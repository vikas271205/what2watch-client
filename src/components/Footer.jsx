import { Link } from "react-router-dom";
import { Github, Twitter } from "lucide-react"; // Import icons

function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-400 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {/* Column 1: Logo + Intro */}
          <div>
            <h2 className="text-white text-2xl font-bold mb-3">🎬 UncleFilmFinder</h2>
            <p className="text-sm leading-relaxed">
              Your AI-powered guide to discovering trending movies, TV shows, and hidden gems.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Navigation</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/trending" className="hover:text-white transition-colors">Trending</Link></li>
              <li><Link to="/watchlist" className="hover:text-white transition-colors">Watchlist</Link></li>
              <li><Link to="/search" className="hover:text-white transition-colors">Search</Link></li>
            </ul>
          </div>

          {/* Column 3: Contact + Socials */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Contact</h3>
            <p className="text-sm mb-4">📧 hello@unclefilmfinder.com</p>
            <div className="flex gap-4">
              <a href="https://github.com/" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <Github className="w-5 h-5 hover:text-white transition-colors" />
              </a>
              <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <Twitter className="w-5 h-5 hover:text-white transition-colors" />
              </a>
            </div>
          </div>
        </div>

        {/* Separator and Copyright */}
        <hr className="border-t border-gray-700/50 my-8" />
        <div className="text-center text-xs text-gray-500">
          © 2025 UncleFilmFinder. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
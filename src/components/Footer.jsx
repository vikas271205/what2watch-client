// src/components/Footer.jsx

import { Link } from "react-router-dom";
import { Github, Twitter } from "lucide-react";

function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center gap-6">

          {/* Logo */}
          <h2 className="text-white text-3xl font-black tracking-tighter">
            UncleFilmFinder
          </h2>

          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium">
            <Link to="/" className="hover:text-indigo-400 transition-colors">Home</Link>
            <Link to="/trending" className="hover:text-indigo-400 transition-colors">Trending</Link>
            <Link to="/watchlist" className="hover:text-indigo-400 transition-colors">Watchlist</Link>
            <Link to="/search" className="hover:text-indigo-400 transition-colors">Search</Link>
          </nav>
          
          {/* Divider */}
          <div className="w-24 border-t border-gray-700"></div>

          {/* Social Icons */}
          <div className="flex gap-5">
            <a href="https://github.com/" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-indigo-400 transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-indigo-400 transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
          </div>

          {/* Copyright & Disclaimer */}
          <div className="text-center text-xs text-gray-500">
            <p>© 2025 UncleFilmFinder. All Rights Reserved.</p>
            <p className="mt-1">All movie data provided by The Movie Database (TMDB). This project is for educational purposes only.</p>
          </div>

        </div>
      </div>
    </footer>
  );
}

export default Footer;

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { Menu, X, Moon, Sun, Search } from "lucide-react";
import useDarkMode from "../utils/useDarkMode";

function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const [darkMode, setDarkMode] = useDarkMode();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, [auth]);

  const handleLogout = () =>
    signOut(auth)
      .then(() => navigate("/"))
      .catch((err) => console.error("Logout Error:", err));

  return (
    <nav className="bg-gradient-to-br from-gray-900 to-black text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 py-2 sm:py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-xl sm:text-2xl font-bold tracking-wide bg-gradient-to-r from-indigo-400 to-purple-600 bg-clip-text text-transparent">
          What2Watch
        </Link>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 sm:gap-3 md:hidden">
          <Link to="/search" aria-label="Search" className="hover:text-indigo-400 transition-colors duration-200">
            <Search size={18} className="sm:w-6 sm:h-6 transition-colors duration-200" />
          </Link>
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle Dark Mode"
            className="hover:text-indigo-400 transition-colors duration-200"
          >
            {darkMode ? <Sun size={16} className="sm:w-5 sm:h-5" /> : <Moon size={16} className="sm:w-5 sm:h-5" />}
          </button>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle Menu"
            className="hover:text-indigo-400 transition-colors duration-200"
          >
            {menuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-4 sm:gap-6 items-center">
          <Link to="/" className="hover:text-indigo-400 transition-colors duration-200">Home</Link>
          <Link to="/trending" className="hover:text-indigo-400 transition-colors duration-200">Trending</Link>
          <Link to="/search" className="hover:text-indigo-400 transition-colors duration-200">Search</Link>
          <Link to="/genres" className="hover:text-indigo-400 transition-colors duration-200">Genres</Link>
          <Link to="/watchlist" className="hover:text-indigo-400 transition-colors duration-200">Watchlist</Link>
          <Link to="/tvshows" className="hover:text-indigo-400 transition-colors duration-200">TV Shows</Link>
          <Link to="/recommended" className="hover:text-indigo-400 transition-colors duration-200">Recommended</Link>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="hover:text-indigo-400 transition-colors duration-200"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {!user ? (
            <>
              <Link to="/login" className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors duration-200 text-sm sm:text-base">
                Login
              </Link>
              <Link to="/signup" className="px-2 sm:px-3 py-1 sm:py-1.5 border border-white rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-200 text-sm sm:text-base">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link to="/profile" className="hover:opacity-90 transition-opacity duration-200">
                <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm sm:text-base">
                  <span>{user.email?.charAt(0).toUpperCase() || "U"}</span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-700 px-2 sm:px-4 py-2 flex flex-col gap-2 sm:gap-3">
          <Link to="/search" onClick={() => setMenuOpen(false)} className="hover:text-indigo-400 transition-colors duration-200 text-sm sm:text-base">Search</Link>
          <Link to="/trending" onClick={() => setMenuOpen(false)} className="hover:text-indigo-400 transition-colors duration-200 text-sm sm:text-base">Trending</Link>
          <Link to="/genres" onClick={() => setMenuOpen(false)} className="hover:text-indigo-400 transition-colors duration-200 text-sm sm:text-base">Genres</Link>
          <Link to="/watchlist" onClick={() => setMenuOpen(false)} className="hover:text-indigo-400 transition-colors duration-200 text-sm sm:text-base">Watchlist</Link>
          <Link to="/tvshows" onClick={() => setMenuOpen(false)} className="hover:text-indigo-400 transition-colors duration-200 text-sm sm:text-base">TV Shows</Link>
          <Link to="/recommended" onClick={() => setMenuOpen(false)} className="hover:text-indigo-400 transition-colors duration-200 text-sm sm:text-base">Recommended</Link>

          {!user ? (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="bg-white text-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm sm:text-base">Login</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="border border-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm sm:text-base">Sign Up</Link>
            </>
          ) : (
            <>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="hover:opacity-90 transition-opacity duration-200">
                <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm sm:text-base">
                  <span>{user.email?.charAt(0).toUpperCase() || "U"}</span>
                </div>
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="bg-red-600 hover:bg-red-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors duration-200 text-sm sm:text-base"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
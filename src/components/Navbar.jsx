import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { Menu, X, Moon, Sun, Search } from "lucide-react";
import useDarkMode from "../utils/useDarkMode";
import useAdminClaim from "../hooks/useAdminClaim";

function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const [darkMode, setDarkMode] = useDarkMode();
  const { isAdmin } = useAdminClaim();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, [auth]);

  const handleLogout = () =>
    signOut(auth)
      .then(() => navigate("/"))
      .catch((err) => console.error("Logout Error:", err));

  return (
    <nav className="relative w-full overflow-x-hidden bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-lg">

      <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 md:px-6 py-2 sm:py-3 flex items-center justify-between overflow-x-hidden">

        {/* Logo */}
        <Link
          to="/"
          className="text-xl sm:text-2xl font-bold tracking-wide bg-gradient-to-r from-indigo-400 to-purple-600 bg-clip-text text-transparent"
        >
          UncleFilmFinder
        </Link>

        {/* Mobile Controls */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            to="/search"
            aria-label="Search"
            className="hover:text-indigo-500 transition-colors duration-200"
          >
            <Search size={22} />
          </Link>
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle Dark Mode"
            className="hover:text-indigo-500 transition-colors duration-200"
          >
            {darkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle Menu"
            className="hover:text-indigo-500 transition-colors duration-200"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-4 sm:gap-6 items-center">
          <Link to="/" className="hover:text-indigo-500">Home</Link>
          <Link to="/trending" className="hover:text-indigo-500">Trending</Link>
          <Link to="/search" className="hover:text-indigo-500">Search</Link>
          <Link to="/genres" className="hover:text-indigo-500">Genres</Link>
          <Link to="/watchlist" className="hover:text-indigo-500">Watchlist</Link>
          <Link to="/tvshows" className="hover:text-indigo-500">TV Shows</Link>

          <Link to="/unclespick" className="hover:text-indigo-400">
            Uncle's Pick
          </Link>


          {isAdmin && (
            <Link
              to="/admin/recommend"
              className="hover:text-yellow-400 font-semibold"
            >
              Admin
            </Link>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle Dark Mode"
            className="hover:text-indigo-500"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {!user ? (
            <>
              <Link
                to="/login"
                className="px-3 py-1 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 text-sm sm:text-base"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-3 py-1 border border-white rounded-lg font-semibold hover:bg-gray-800 text-sm sm:text-base"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link to="/profile" className="hover:opacity-90">
                <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm sm:text-base">
                  <span>{user.email?.charAt(0).toUpperCase() || "U"}</span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-sm sm:text-base"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-700 px-3 py-3 flex flex-col gap-2 text-sm">
          <Link to="/search" onClick={() => setMenuOpen(false)} className="hover:text-indigo-400">Search</Link>
          <Link to="/trending" onClick={() => setMenuOpen(false)} className="hover:text-indigo-400">Trending</Link>
          <Link to="/genres" onClick={() => setMenuOpen(false)} className="hover:text-indigo-400">Genres</Link>
          <Link to="/watchlist" onClick={() => setMenuOpen(false)} className="hover:text-indigo-400">Watchlist</Link>
          <Link to="/tvshows" onClick={() => setMenuOpen(false)} className="hover:text-indigo-400">TV Shows</Link>
          <Link
            to="/unclespick"
            onClick={() => setMenuOpen(false)}
            className="hover:text-indigo-400"
          >
            Uncle's Pick
          </Link>


          {isAdmin && (
            <Link
              to="/admin/recommend"
              onClick={() => setMenuOpen(false)}
              className="hover:text-yellow-400 font-semibold"
            >
              Admin
            </Link>
          )}
          {!user ? (
            <>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="bg-white text-black px-3 py-1 rounded-lg hover:bg-gray-200"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMenuOpen(false)}
                className="border border-white px-3 py-1 rounded-lg hover:bg-gray-800"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="hover:opacity-90"
              >
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </div>
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg"
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

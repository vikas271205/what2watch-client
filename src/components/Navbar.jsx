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
    <nav className="bg-black text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold">
          What2Watch
        </Link>

        {/* Mobile Controls */}
        <div className="flex items-center gap-4 md:hidden">
          <Link to="/search" aria-label="Search">
            <Search size={22} className="hover:text-gray-300" />
          </Link>
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle Dark Mode"
            className="hover:opacity-80"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle Menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-6 items-center">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/trending" className="hover:underline">Trending</Link>
          <Link to="/search" className="hover:underline">Search</Link>
          <Link to="/genres" className="hover:underline">Genres</Link>
          <Link to="/watchlist" className="hover:underline">Watchlist</Link>
          <Link to="/tvshows" className="hover:underline">TV Shows</Link>
          <Link to="/recommended" className="hover:underline">Recommended</Link>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="hover:opacity-80"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {!user ? (
            <>
              <Link to="/login" className="px-3 py-1 bg-white text-black rounded font-semibold">Login</Link>
              <Link to="/signup" className="px-3 py-1 border border-white rounded font-semibold">Sign Up</Link>
            </>
          ) : (
            <>
              <Link to="/profile" className="hover:opacity-80">
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold">
                  <span>{user.email?.charAt(0).toUpperCase() || "U"}</span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded font-semibold"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-black border-t border-gray-700 px-4 pb-4 flex flex-col gap-4">
          <Link to="/search" onClick={() => setMenuOpen(false)}>Search</Link>
          <Link to="/trending" onClick={() => setMenuOpen(false)}>Trending</Link>
          <Link to="/genres" onClick={() => setMenuOpen(false)}>Genres</Link>
          <Link to="/watchlist" onClick={() => setMenuOpen(false)}>Watchlist</Link>
          <Link to="/tvshows" onClick={() => setMenuOpen(false)}>TV Shows</Link>
          <Link to="/recommended" onClick={() => setMenuOpen(false)}>Recommended</Link>

          {!user ? (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="bg-white text-black px-3 py-1 rounded">Login</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="border border-white px-3 py-1 rounded">Sign Up</Link>
            </>
          ) : (
            <>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold">
                  <span>{user.email?.charAt(0).toUpperCase() || "U"}</span>
                </div>
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
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

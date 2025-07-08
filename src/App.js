import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Watchlist from "./pages/Watchlist";
import Search from "./pages/Search";
import MovieDetail from "./pages/MovieDetail";
import Profile from "./pages/Profile";
import TVDetail from "./pages/TVDetail";
import TVShows from "./pages/TVShows";
import Recommended from "./pages/UnclesPick";
import Genres from "./pages/Genres";
import CastDetail from "./pages/CastDetail";
import Trending from "./pages/Trending";
import ChatAssistant from "./pages/ChatAssistant";
import { LoadingProvider } from "./context/LoadingContext";
import AdminRecommend from "./pages/AdminRecommend";
import AdminRoute from "./components/AdminRoute";
import UnclesPick from "./pages/UnclesPick";
import ThemeLayout from "./components/ThemeLayout";
function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    }
  }, []);

  const toggleDarkMode = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newTheme);
  };

  return (
    <LoadingProvider>
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <Routes>
        <Route element={<ThemeLayout />}></Route>
        <Route path="/" element={<Home />} />
        <Route path="/genres" element={<Genres />} />
        <Route path="/unclespick" element={<UnclesPick />} />
        <Route path="/tvshows" element={<TVShows />} />
        <Route path="/tv/:id" element={<TVDetail />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/search" element={<Search />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/person/:id" element={<CastDetail />} />
        <Route path="/trending" element={<Trending />} />
        <Route path="/assistant" element={<ChatAssistant />} />
        <Route path="/admin/recommend" element={
  <AdminRoute>
    <AdminRecommend />
  </AdminRoute>
} />
      </Routes>

      <Link
        to="/assistant"
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 transition z-50"
      >
        💬 Ask Assistant
      </Link>
    </LoadingProvider>
  );
}

export default App;

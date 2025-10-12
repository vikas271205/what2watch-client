import { Routes, Route, useLocation, Link } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Watchlist from "./pages/Watchlist";
import Search from "./pages/Search";
import MovieDetail from "./pages/MovieDetail";
import Profile from "./pages/Profile";
import TVDetail from "./pages/TVDetail";
import TVShows from "./pages/TVShows";
import UnclesPick from "./pages/UnclesPick";
import Genres from "./pages/Genres";
import CastDetail from "./pages/CastDetail";
import Trending from "./pages/Trending";
import ChatAssistant from "./pages/ChatAssistant";
import AdminRecommend from "./pages/AdminRecommend";
import AdminRoute from "./components/AdminRoute";
import { LoadingProvider } from "./context/LoadingContext";

// --- Assuming your ThemeLayout is structured like this ---
// --- I've added the fixes directly into this component ---
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar"; // Assuming you have a Navbar component
import Footer from "./components/Footer"; // Assuming you have a Footer component
import { Bot } from "lucide-react";


function ThemeLayout() {
  const location = useLocation();
  const isChatPage = location.pathname === '/assistant';

  return (
    // --- FIX 1: This div structure ensures the layout has a minimum height of the screen ---
    // and that child elements can correctly fill the remaining space.
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
      
      {/* --- FIX 2: Conditionally render the "Ask Assistant" button --- */}
      {/* It will now be hidden when you are on the /assistant page */}
      {!isChatPage && (
        <Link 
          to="/assistant" 
          className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110 z-50 flex items-center gap-2"
          aria-label="Ask Assistant"
        >
          <Bot size={24} />
          <span className="hidden sm:inline">Ask Assistant</span>
        </Link>
      )}

      {/* Hide footer on chat page for a cleaner, full-screen experience */}
      {!isChatPage && <Footer />}
    </div>
  );
}


export default function App() {
  return (
    <LoadingProvider>
      <Routes>
        <Route element={<ThemeLayout />}>
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
          <Route
            path="/admin/recommend"
            element={
              <AdminRoute>
                <AdminRecommend />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </LoadingProvider>
  );
}


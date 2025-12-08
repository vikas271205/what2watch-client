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

import AdminRecommend from "./pages/AdminRecommend";
import AdminRoute from "./components/AdminRoute";
import { LoadingProvider } from "./context/LoadingContext";

// --- Assuming your ThemeLayout is structured like this ---
// --- I've added the fixes directly into this component ---
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar"; 
import Footer from "./components/Footer"; 



function ThemeLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <Navbar />

      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>

      <Footer />
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


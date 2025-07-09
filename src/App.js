import { Routes, Route } from "react-router-dom";
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
import ThemeLayout from "./components/ThemeLayout";
import { LoadingProvider } from "./context/LoadingContext";

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

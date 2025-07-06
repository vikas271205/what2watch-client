import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import MovieCard from "../components/MovieCard";

function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("All");

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchWatchlist = async () => {
      setLoading(true);
      const q = query(collection(db, "watchlists"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);

      const ratingsSnapshot = await getDocs(
        query(collection(db, "ratings"), where("userId", "==", user.uid))
      );
      const ratingMap = {};
      ratingsSnapshot.forEach((doc) => {
        const r = doc.data();
        ratingMap[r.movieId] = r.rating;
      });

      const data = snapshot.docs.map((doc) => {
        const movie = doc.data();
        return {
          id: movie.movieId,
          title: movie.title,
          imageUrl: movie.imageUrl,
          publicRating: movie.rating,
          userRating: ratingMap[movie.movieId],
          timestamp: movie.timestamp?.toDate(),
          docId: doc.id,
          genre: movie.genre || "Unknown",
          language: movie.language || "en",
        };
      });

      setWatchlist(data);
      const genreSet = new Set(data.map((m) => m.genre || "Unknown"));
      setGenres(["All", ...Array.from(genreSet)]);
      setLoading(false);
    };

    fetchWatchlist();
  }, [user]);

  const handleRemove = async (docId) => {
    await deleteDoc(doc(db, "watchlists", docId));
    setWatchlist((prev) => prev.filter((m) => m.docId !== docId));
  };

  const handleRate = async (movie, newRating) => {
    if (!user) return;
    const docKey = `${user.uid}_${movie.id}`;
    await setDoc(doc(db, "ratings", docKey), {
      userId: user.uid,
      movieId: movie.id,
      title: movie.title,
      imageUrl: movie.imageUrl,
      rating: newRating,
      language: movie.language,
    });

    setWatchlist((prev) =>
      prev.map((m) =>
        m.id === movie.id ? { ...m, userRating: newRating } : m
      )
    );
  };

  const filtered = watchlist
    .filter((m) =>
      m.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
    )
    .filter((m) => selectedGenre === "All" || m.genre === selectedGenre)
    .sort((a, b) => {
      if (sortBy === "rating") return (b.userRating || 0) - (a.userRating || 0);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return b.timestamp - a.timestamp;
    });

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 md:px-10 bg-white text-black dark:bg-zinc-900 dark:text-white transition-colors duration-300">
      <h1 className="text-3xl sm:text-4xl font-bold text-center mb-10 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
        🎬 Your Watchlist
      </h1>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8 justify-between">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title..."
          className="flex-1 px-4 py-2 rounded-md border border-gray-300 bg-white text-black dark:bg-zinc-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 rounded-md bg-white text-black dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600"
        >
          <option value="date">Sort by Date</option>
          <option value="rating">Sort by Rating</option>
          <option value="title">Sort by Title</option>
        </select>

        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="px-4 py-2 rounded-md bg-white text-black dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600"
        >
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-300">
          Loading your saved movies...
        </p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center text-gray-500 dark:text-gray-300 mt-20">
          <img
            src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
            alt="Empty watchlist"
            className="w-28 h-28 sm:w-32 sm:h-32 mb-6 opacity-60"
          />
          <p className="text-lg font-medium">
            No movies found in your watchlist.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filtered.map((movie) => (
            <div
              key={movie.id}
              className="hover:scale-105 transition-transform duration-200"
            >
              <MovieCard
                id={movie.id}
                title={movie.title}
                imageUrl={movie.imageUrl}
                publicRating={movie.publicRating}
                userRating={movie.userRating}
                showRemoveButton={true}
                language={movie.language}
                onRemove={() => handleRemove(movie.docId)}
                onRate={(star) => handleRate(movie, star)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Added: {movie.timestamp?.toLocaleDateString() || "N/A"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Watchlist;

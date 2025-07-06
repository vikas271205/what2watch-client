// src/pages/Profile.jsx
import { useContext, useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import MovieCard from "../components/MovieCard";

function Profile() {
  const { user } = useContext(AuthContext);
  const [watchlist, setWatchlist] = useState([]);
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const wQuery = query(
        collection(db, "watchlists"),
        where("userId", "==", user.uid)
      );
      const wSnap = await getDocs(wQuery);
      const watchlistData = wSnap.docs.map((d) => d.data());

      const rQuery = query(
        collection(db, "ratings"),
        where("userId", "==", user.uid)
      );
      const rSnap = await getDocs(rQuery);
      const ratingData = rSnap.docs.map((d) => d.data());

      setWatchlist(watchlistData);
      setRatings(ratingData);
    };

    fetchData();
  }, [user]);

  const saveRating = async (movie, newRating) => {
    if (!user) return;
    const docKey = `${user.uid}_${movie.movieId}`;

    await setDoc(doc(db, "ratings", docKey), {
      userId: user.uid,
      movieId: movie.movieId,
      title: movie.title,
      imageUrl: movie.imageUrl,
      publicRating: movie.rating || movie.publicRating,
      rating: newRating,
      language: movie.language,
    });

    setRatings((prev) => {
      const exists = prev.find((m) => m.movieId === movie.movieId);
      if (exists) {
        return prev.map((m) =>
          m.movieId === movie.movieId ? { ...m, rating: newRating } : m
        );
      } else {
        return [...prev, { ...movie, rating: newRating }];
      }
    });
  };

  const removeFromWatchlist = async (movieId) => {
    const docKey = `${user.uid}_${movieId}`;
    await deleteDoc(doc(db, "watchlists", docKey));
    setWatchlist((prev) => prev.filter((m) => m.movieId !== movieId));
  };

  const removeFromRatings = async (movieId) => {
    const docKey = `${user.uid}_${movieId}`;
    await deleteDoc(doc(db, "ratings", docKey));
    setRatings((prev) => prev.filter((m) => m.movieId !== movieId));
  };

  const ratingMap = {};
  ratings.forEach((r) => (ratingMap[r.movieId] = r.rating));

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10 max-w-6xl mx-auto text-white">
      <h2 className="text-3xl font-bold mb-6 text-center sm:text-left">👤 Profile</h2>

      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg mb-10 text-sm sm:text-base">
        <p>
          <strong>Email:</strong> {user?.email}
        </p>
      </div>

      {/* Watchlist Section */}
      <section className="mb-12">
        <h3 className="text-xl font-semibold mb-4">🎬 Your Watchlist</h3>
        {watchlist.length === 0 ? (
          <p className="text-gray-400">No movies in your watchlist.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {watchlist.map((movie) => (
              <MovieCard
                key={movie.movieId}
                id={movie.movieId}
                title={movie.title}
                imageUrl={movie.imageUrl}
                publicRating={movie.rating}
                userRating={ratingMap[movie.movieId]}
                showRemoveButton={true}
                language={movie.language}
                onRemove={() => removeFromWatchlist(movie.movieId)}
                onRate={(star) => saveRating(movie, star)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Rated Movies Section */}
      <section>
        <h3 className="text-xl font-semibold mb-4">⭐ Movies You've Rated</h3>
        {ratings.length === 0 ? (
          <p className="text-gray-400">You haven't rated any movies yet.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {ratings.map((movie) => (
              <MovieCard
                key={movie.movieId}
                id={movie.movieId}
                title={movie.title}
                imageUrl={movie.imageUrl}
                showUncleScore={false}
                publicRating={null}
                userRating={movie.rating}
                showRemoveButton={true}
                language={movie.language}
                onRemove={() => removeFromRatings(movie.movieId)}
                onRate={(star) => saveRating(movie, star)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Profile;

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import API_BASE from "../utils/api";
import MovieCard from "../components/MovieCard";
import { motion } from "framer-motion";
import { getWatchmodeId, getStreamingSources } from "../api/watchmode";

function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [trailerUrl, setTrailerUrl] = useState("");
  const [cast, setCast] = useState([]);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState("");
  const [allComments, setAllComments] = useState([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const user = auth.currentUser;
  const [watchmodeSources, setWatchmodeSources] = useState([]);


  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchAll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/movie/${id}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const movieData = await res.json();
        setMovie(movieData);
        setMovie(movieData);

        const wmId = await getWatchmodeId(
          movieData.title,
          movieData.release_date?.slice(0, 4),
          movieData.id.toString()
        );

        console.log("🎯 Watchmode ID:", wmId);

        if (wmId) {
          const sources = await getStreamingSources(wmId);
          setWatchmodeSources(sources);
          console.log("✅ Watchmode sources:", sources);
        }
        

        const trailerRes = await fetch(`${API_BASE}/api/tmdb/movie/${id}/videos`);
        if (!trailerRes.ok) throw new Error(`HTTP error! status: ${trailerRes.status}`);
        const trailerData = await trailerRes.json();
        const trailer = trailerData.results.find(
          (v) => v.type === "Trailer" && v.site === "YouTube"
        );
        if (trailer) setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}`);

        const castRes = await fetch(`${API_BASE}/api/tmdb/movie/${id}/credits`);
        if (!castRes.ok) throw new Error(`HTTP error! status: ${castRes.status}`);
        const castData = await castRes.json();
        setCast(castData.cast.slice(0, 6));

        const similarRes = await fetch(`${API_BASE}/api/tmdb/movie/${id}/similar`);
        if (!similarRes.ok) throw new Error(`HTTP error! status: ${similarRes.status}`);
        const similarData = await similarRes.json();
        setRelatedMovies(similarData.results.slice(0, 6).map(m => ({
          ...m,
          tmdbRating: m.vote_average?.toString(),
          language: m.original_language,
          genres: m.genre_ids
            ?.map(id => movieData.genres.find(g => g.id === id)?.name)
            .filter(Boolean),
        })));

        if (user) {
          const watchRef = doc(db, "watchlists", `${user.uid}_${id}`);
          const watchSnap = await getDoc(watchRef);
          setIsSaved(watchSnap.exists());

          const rateRef = doc(db, "ratings", `${user.uid}_${id}`);
          const rateSnap = await getDoc(rateRef);
          if (rateSnap.exists()) setUserRating(rateSnap.data().rating);

          const q = query(collection(db, "comments"), where("movieId", "==", id));
          const snapshot = await getDocs(q);
          const commentData = snapshot.docs
            .map((doc) => doc.data())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setAllComments(commentData);
        }
      } catch (err) {
        console.error("Failed to fetch movie details:", err);
      }
    };

    fetchAll();
  }, [id, user]);

  const toggleWatchlist = async () => {
    if (!user) return;
    const ref = doc(db, "watchlists", `${user.uid}_${id}`);
    if (isSaved) {
      await deleteDoc(ref);
      setIsSaved(false);
    } else {
      await setDoc(ref, {
        userId: user.uid,
        movieId: id,
        title: movie.title,
        imageUrl: `https://image.tmdb.org/t/p/w300${movie.poster_path}`,
        rating: movie.vote_average?.toString(),
        timestamp: serverTimestamp(),
      });
      setIsSaved(true);
    }
  };

  const handleRating = async (newRating) => {
    if (!user || !isSaved) return;
    const ref = doc(db, "ratings", `${user.uid}_${id}`);
    await setDoc(ref, {
      userId: user.uid,
      movieId: id,
      rating: newRating,
    });
    setUserRating(newRating);
  };

  const submitComment = async () => {
    if (!user || !comment.trim()) return;
    const commentId = `${user.uid}_${Date.now()}`;
    const commentRef = doc(db, "comments", commentId);
    await setDoc(commentRef, {
      movieId: id,
      userId: user.uid,
      userEmail: user.email,
      comment: comment.trim(),
      timestamp: new Date().toISOString(),
    });

    setComment("");
    const q = query(collection(db, "comments"), where("movieId", "==", id));
    const snapshot = await getDocs(q);
    const data = snapshot.docs
      .map((doc) => doc.data())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setAllComments(data);
  };

  if (!movie) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
    </div>
  );
  console.log("movie", movie);

  return (
    <div className="relative min-h-screen bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300">

      {movie.backdrop_path && (
        <div className="absolute inset-0 -z-10">
          <div
            className="w-full h-full bg-cover bg-center filter blur-sm opacity-60"
            style={{
              backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/80" />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pt-16 sm:pt-20">
        {/* Movie Info */}
        <motion.div
          className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex-shrink-0 w-48 sm:w-64 md:w-72 rounded-lg overflow-hidden shadow-lg">
            <img
              src={
                movie.poster_path
                  ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                  : "https://via.placeholder.com/300x450?text=No+Image"
              }
              alt={movie.title}
              className="w-full aspect-[2/3] object-cover rounded-lg"
              loading="lazy"
            />
          </div>
          <div className="flex-1 space-y-3 sm:space-y-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
              {movie.title}
            </h1>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-gray-600 dark:text-gray-400">
              <p className="text-sm sm:text-base font-semibold">
                {movie.release_date?.slice(0, 4)} • {movie.runtime} mins
              </p>
              <div className="flex flex-wrap gap-2">
                {movie.genres?.map((g) => (
                  <span
                    key={g.id}
                    className="px-2 sm:px-3 py-1 rounded-full bg-indigo-600 text-xs sm:text-sm text-white"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4 text-gray-700 dark:text-gray-300">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm sm:text-base">TMDB:</span>
                <span className="text-yellow-500 font-bold text-sm sm:text-base">
                  {movie.vote_average?.toFixed(1)}
                </span>
                <span className="text-xs sm:text-sm text-gray-400">({movie.vote_count} votes)</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <motion.button
                onClick={toggleWatchlist}
                className={`px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base font-semibold transition-colors ${
                  isSaved ? "bg-green-600" : "bg-gray-700 dark:bg-gray-800"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSaved ? "In Watchlist ✅" : "Add to Watchlist"}
              </motion.button>
              <motion.select
                value={userRating}
                onChange={(e) => handleRating(Number(e.target.value))}
                disabled={!isSaved}
                className="bg-gray-100 dark:bg-gray-800 px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base dark:text-white text-black cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <option value="0">Rate</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    ⭐ {i + 1}
                  </option>
                ))}
              </motion.select>



            </div>
            {watchmodeSources.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                <h4 className="w-full font-semibold text-sm sm:text-base text-gray-400 dark:text-gray-300">Available on:</h4>
                {watchmodeSources.map((s) => (
                  <a
                    key={s.source_id}
                    href={s.web_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-red-600 rounded-full text-white text-xs sm:text-sm font-medium"
                  >
                    {s.name}
                  </a>
                ))}
              </div>
            )}

            <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300 max-w-2xl line-clamp-6">
              {movie.overview}
            </p>
          </div>
        </motion.div>

        {/* Trailer */}
        {trailerUrl && (
          <motion.section
            className="mt-8 sm:mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4">🎬 Watch Trailer</h3>
            <div className="relative overflow-hidden rounded-xl shadow-lg border border-gray-700 aspect-video">
              <iframe
                src={trailerUrl}
                title="Trailer"
                className="w-full h-full rounded-lg"
                allowFullScreen
              />
            </div>
          </motion.section>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <motion.section
            className="mt-8 sm:mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-indigo-400">👥 Cast</h2>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-800">
              {cast.map((member) => (
                <Link
                  key={member.id}
                  to={`/person/${member.id}`}
                  className="flex-shrink-0 w-32 sm:w-40 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-lg"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <img
                      src={
                        member.profile_path
                          ? `https://image.tmdb.org/t/p/w300${member.profile_path}`
                          : "https://via.placeholder.com/300x450?text=No+Image"
                      }
                      alt={member.name}
                      className="w-full h-40 sm:h-48 object-cover"
                      loading="lazy"
                    />
                    <p className="text-center p-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 line-clamp-2">
                      {member.name}
                    </p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Related Movies */}
        {relatedMovies.length > 0 && (
          <motion.section
            className="mt-8 sm:mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-indigo-400">📽️ Related Movies</h2>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-800">
              {relatedMovies.map((m) => (
                <MovieCard
                  key={m.id}
                  id={m.id}
                  title={m.title}
                  imageUrl={`https://image.tmdb.org/t/p/w300${m.poster_path}`}
                  tmdbRating={m.tmdbRating}
                  genres={m.genres}
                  language={m.original_language}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Comments */}
        <motion.section
          className="mt-8 sm:mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-indigo-400">💬 Comments</h2>
          {user && (
            <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-6">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Leave a comment..."
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm sm:text-base text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <motion.button
                onClick={submitComment}
                className="px-3 sm:px-4 py-2 rounded-lg bg-indigo-600 text-sm sm:text-base font-medium text-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Post
              </motion.button>
            </div>
          )}
          {allComments.length > 0 ? (
            <ul className="space-y-3 sm:space-y-4">
              {allComments.slice(0, showAllComments ? undefined : 3).map((c) => (
                <motion.li
                  key={c.timestamp}
                  className="bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-xs sm:text-sm text-gray-500 mb-1 font-semibold">{c.userEmail}</p>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-line">{c.comment}</p>
                </motion.li>
              ))}
              {allComments.length > 3 && (
                <motion.button
                  onClick={() => setShowAllComments(!showAllComments)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm sm:text-base"
                  whileHover={{ scale: 1.05 }}
                >
                  {showAllComments ? "Show Fewer" : `Show All (${allComments.length})`}
                </motion.button>
              )}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm sm:text-base italic">No comments yet.</p>
          )}
        </motion.section>
      </div>
    </div>
  );

}

export default MovieDetail;
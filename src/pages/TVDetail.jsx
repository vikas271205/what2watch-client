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

function TVDetail() {
  const { id } = useParams();
  const [tv, setTV] = useState(null);
  const [trailerUrl, setTrailerUrl] = useState("");
  const [cast, setCast] = useState([]);
  const [related, setRelated] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState("");
  const [allComments, setAllComments] = useState([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/tv/${id}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setTV(data);

        const trailerRes = await fetch(`${API_BASE}/api/tmdb/tv/${id}/videos`);
        if (!trailerRes.ok) throw new Error(`HTTP error! status: ${trailerRes.status}`);
        const trailerData = await trailerRes.json();
        const trailer = trailerData.results.find((v) => v.type === "Trailer" && v.site === "YouTube");
        if (trailer) setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}`);

        const castRes = await fetch(`${API_BASE}/api/tmdb/tv/${id}/credits`);
        if (!castRes.ok) throw new Error(`HTTP error! status: ${castRes.status}`);
        const castData = await castRes.json();
        setCast(castData.cast.slice(0, 6));

        const similarRes = await fetch(`${API_BASE}/api/tmdb/tv/${id}/similar`);
        if (!similarRes.ok) throw new Error(`HTTP error! status: ${similarRes.status}`);
        const similarData = await similarRes.json();
        setRelated(similarData.results.slice(0, 6).map(m => ({
          ...m,
          tmdbRating: m.vote_average?.toString(),
          language: m.original_language,
          genres: m.genre_ids?.map(id => data.genres.find(g => g.id === id)?.name || ""),
        })));

        if (user) {
          const watchRef = doc(db, "watchlists", `${user.uid}_${id}_tv`);
          const watchSnap = await getDoc(watchRef);
          setIsSaved(watchSnap.exists());

          const rateRef = doc(db, "ratings", `${user.uid}_${id}_tv`);
          const rateSnap = await getDoc(rateRef);
          if (rateSnap.exists()) setUserRating(rateSnap.data().rating);

          const q = query(collection(db, "comments"), where("tvId", "==", `${id}_tv`));
          const snapshot = await getDocs(q);
          const commentData = snapshot.docs
            .map((doc) => doc.data())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setAllComments(commentData);
        }
      } catch (err) {
        console.error("TVDetail Error:", err);
      }
    };

    fetchAll();
  }, [id, user]);

  const toggleWatchlist = async () => {
    if (!user) return;
    const ref = doc(db, "watchlists", `${user.uid}_${id}_tv`);
    if (isSaved) {
      await deleteDoc(ref);
      setIsSaved(false);
    } else {
      await setDoc(ref, {
        userId: user.uid,
        tvId: `${id}_tv`,
        title: tv.name,
        imageUrl: `https://image.tmdb.org/t/p/w300${tv.poster_path}`,
        rating: tv.vote_average?.toString(),
        timestamp: serverTimestamp(),
      });
      setIsSaved(true);
    }
  };

  const handleRating = async (newRating) => {
    if (!user || !isSaved) return;
    const ref = doc(db, "ratings", `${user.uid}_${id}_tv`);
    await setDoc(ref, {
      userId: user.uid,
      tvId: `${id}_tv`,
      rating: newRating,
    });
    setUserRating(newRating);
  };

  const submitComment = async () => {
    if (!user || !comment.trim()) return;
    const commentId = `${user.uid}_${Date.now()}`;
    const commentRef = doc(db, "comments", commentId);
    await setDoc(commentRef, {
      tvId: `${id}_tv`,
      userId: user.uid,
      userEmail: user.email,
      comment: comment.trim(),
      timestamp: new Date().toISOString(),
    });
    setComment("");
    const q = query(collection(db, "comments"), where("tvId", "==", `${id}_tv`));
    const snapshot = await getDocs(q);
    const data = snapshot.docs
      .map((doc) => doc.data())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setAllComments(data);
  };

  if (!tv) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      {tv.backdrop_path && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-cover bg-center filter blur-md opacity-30 -z-10"
          style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${tv.backdrop_path})` }}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pt-16 sm:pt-20">
        <motion.div
          className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex-shrink-0 w-48 sm:w-64 md:w-72 rounded-lg overflow-hidden shadow-lg">
            <img
              src={
                tv.poster_path
                  ? `https://image.tmdb.org/t/p/w300${tv.poster_path}`
                  : "https://via.placeholder.com/300x450?text=No+Image"
              }
              alt={tv.name}
              className="w-full aspect-[2/3] object-cover rounded-lg"
              loading="lazy"
            />
          </div>
          <div className="flex-1 space-y-3 sm:space-y-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
              {tv.name}
            </h1>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-gray-400">
              <p className="text-sm sm:text-base font-semibold">
                {tv.first_air_date?.slice(0, 4)} • {tv.episode_run_time?.[0] || "N/A"} mins
              </p>
              <div className="flex flex-wrap gap-2">
                {tv.genres?.map((g) => (
                  <span
                    key={g.id}
                    className="px-2 sm:px-3 py-1 rounded-full bg-indigo-600 text-xs sm:text-sm text-white"
                    aria-label={`Genre: ${g.name}`}
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4 text-gray-300">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm sm:text-base">TMDB:</span>
                <span className="text-yellow-400 font-bold text-sm sm:text-base">
                  {tv.vote_average?.toFixed(1)}
                </span>
                <span className="text-gray-500 text-xs sm:text-sm">({tv.vote_count} votes)</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <motion.button
                onClick={toggleWatchlist}
                className={`px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base font-semibold transition-colors ${
                  isSaved ? "bg-green-600" : "bg-gray-700"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isSaved ? "Remove from watchlist" : "Add to watchlist"}
              >
                {isSaved ? "In Watchlist ✅" : "Add to Watchlist"}
              </motion.button>
              <motion.select
                value={userRating}
                onChange={(e) => handleRating(Number(e.target.value))}
                disabled={!isSaved}
                className="bg-gray-800 px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base text-white cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Rate TV show"
              >
                <option value="0">Rate</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    ⭐ {i + 1}
                  </option>
                ))}
              </motion.select>
              <motion.button
                className="px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base font-semibold bg-gray-700 opacity-50 cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled
                aria-label="Available on (coming soon)"
              >
                Available On
              </motion.button>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-gray-300 max-w-2xl line-clamp-6">
              {tv.overview}
            </p>
          </div>
        </motion.div>

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
                  className="flex-shrink-0 w-32 sm:w-40 rounded-lg overflow-hidden bg-gray-800 shadow-lg"
                  aria-label={`View ${member.name} profile`}
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
                    <p className="text-center p-2 text-xs sm:text-sm font-medium text-gray-200 line-clamp-2">
                      {member.name}
                    </p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {related.length > 0 && (
          <motion.section
            className="mt-8 sm:mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-indigo-400">📽️ Related Shows</h2>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-800">
              {related.map((m) => (
                <MovieCard
                  key={m.id}
                  id={m.id}
                  title={m.name}
                  imageUrl={`https://image.tmdb.org/t/p/w300${m.poster_path}`}
                  tmdbRating={m.tmdbRating}
                  genres={m.genres}
                  language={m.original_language}
                  isTV={true}
                />
              ))}
            </div>
          </motion.section>
        )}

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
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-gray-800 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                aria-label="Comment input"
              />
              <motion.button
                onClick={submitComment}
                className="px-3 sm:px-4 py-2 rounded-lg bg-indigo-600 text-sm sm:text-base font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Post comment"
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
                  className="bg-gray-800 p-3 sm:p-4 rounded-xl shadow-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-xs sm:text-sm text-gray-500 mb-1 font-semibold">{c.userEmail}</p>
                  <p className="text-sm sm:text-base text-gray-300 whitespace-pre-line">{c.comment}</p>
                </motion.li>
              ))}
              {allComments.length > 3 && (
                <motion.button
                  onClick={() => setShowAllComments(!showAllComments)}
                  className="text-indigo-400 hover:underline text-sm sm:text-base"
                  whileHover={{ scale: 1.05 }}
                  aria-label={showAllComments ? "Show fewer comments" : "Show all comments"}
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

      <style>
        {`
          .scrollbar-thin::-webkit-scrollbar {
            height: 8px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: #6366f1;
            border-radius: 4px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background-color: #1f2937;
          }
        `}
      </style>
    </div>
  );
}

export default TVDetail;
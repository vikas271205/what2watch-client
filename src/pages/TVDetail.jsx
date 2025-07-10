import { useEffect, useState, useRef } from "react";
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
import { getWatchmodeId, getStreamingSources } from "../api/watchmode";
import { fetchOMDbData } from "../api/omdb";
import ShimmerDetail from "../components/ShimmerDetail";
import { motion } from "framer-motion";
import { Star, Bookmark, PlayCircle, Users, MessageCircle } from "lucide-react";

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
  const [watchmodeSources, setWatchmodeSources] = useState([]);
  const user = auth.currentUser;
  const [omdbRatings, setOmdbRatings] = useState({ imdb: null, rt: null, uncle: null });
  const [tvGenres, setTvGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedRef = useRef(false);
  const [aiOverview, setAiOverview] = useState("");

  useEffect(() => {
    hasFetchedRef.current = false;
    window.scrollTo(0, 0);

    setTV(null);
    setTrailerUrl("");
    setCast([]);
    setRelated([]);
    setIsSaved(false);
    setUserRating(0);
    setComment("");
    setAllComments([]);
    setWatchmodeSources([]);
    setOmdbRatings({ imdb: null, rt: null });
    setLoading(true);

    const fetchGenres = async () => {
      const cached = localStorage.getItem("tmdb_tv_genres");
      if (cached) {
        const parsed = JSON.parse(cached);
        setTvGenres(parsed.genres || parsed);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/genre/tv`);
        const data = await res.json();
        const genresArray = data.genres || data;
        localStorage.setItem("tmdb_tv_genres", JSON.stringify(genresArray));
        setTvGenres(genresArray);
      } catch (err) {
        console.error("Failed to fetch TV genres", err);
        setTvGenres([]);
      }
    };

    const fetchTVData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/tv/${id}`);
        const data = await res.json();
        setTV(data);
        const genresText = data.genres?.map(g => g.name).join(", ");

try {
  const aiRes = await fetch(`${API_BASE}/api/ai/rewrite-overview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "tv",
      title: data.name,
      genre: genresText,
      overview: data.overview,
    }),
  });

  const aiData = await aiRes.json();
if (aiData.rewritten) {
  setAiOverview(aiData.rewritten);
} else {
  setAiOverview(data.overview);
}

} catch (err) {
  console.error("AI Overview Rewrite Error:", err);
}

        const [omdb, wmId] = await Promise.all([
          fetchOMDbData(data.name, data.first_air_date),
          getWatchmodeId(data.name, data.first_air_date?.slice(0, 4))
        ]);

        if (omdb) {
          const imdb = omdb.Ratings?.find(r => r.Source === "Internet Movie Database");
          const rt = omdb.Ratings?.find(r => r.Source === "Rotten Tomatoes");

          const imdbValue = parseFloat(imdb?.Value?.split("/")[0] || omdb.imdbRating) || null;
          const rtValue = parseFloat(rt?.Value?.replace("%", "")) || null;
          const tmdbValue = parseFloat(data.vote_average) || null;

          const sources = [tmdbValue, imdbValue, rtValue ? rtValue / 10 : null].filter(n => typeof n === "number");

          const uncleScore =
            sources.length > 0
              ? (sources.reduce((a, b) => a + b, 0) / sources.length).toFixed(1)
              : null;

          setOmdbRatings({
            imdb: imdb?.Value || omdb.imdbRating || null,
            rt: rt?.Value || null,
            uncle: uncleScore,
          });
        }

        if (wmId) {
          const sources = await getStreamingSources(wmId);
          const filtered = (sources || []).filter(src => src.type === "sub" || src.type === "free");
          setWatchmodeSources(filtered.length ? filtered : [{ name: "Unavailable in India", type: "note", web_url: "" }]);
        }

        const trailerData = await (await fetch(`${API_BASE}/api/tmdb/tv/${id}/videos`)).json();
        const trailer = trailerData.results.find(v => v.type === "Trailer" && v.site === "YouTube");
        if (trailer) setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}`);

        const castData = await (await fetch(`${API_BASE}/api/tmdb/tv/${id}/credits`)).json();
        setCast(castData.cast.slice(0, 6));

        const similarData = await (await fetch(`${API_BASE}/api/tmdb/tv/${id}/similar`)).json();
        const genreMap = data.genres?.reduce((acc, g) => {
          acc[g.id] = g.name;
          return acc;
        }, {}) || {};
        setRelated(similarData.results.slice(0, 6).map((m) => ({
          ...m,
          tmdbRating: m.vote_average?.toString(),
          language: m.original_language,
          genres: m.genre_ids?.map((id) => genreMap[id] || "Unknown"),
        })));

        if (user) {
          const watchSnap = await getDoc(doc(db, "watchlists", `${user.uid}_${id}_tv`));
          setIsSaved(watchSnap.exists());

          const rateSnap = await getDoc(doc(db, "ratings", `${user.uid}_${id}_tv`));
          if (rateSnap.exists()) setUserRating(rateSnap.data().rating);

          const snapshot = await getDocs(query(collection(db, "comments"), where("tvId", "==", `${id}_tv`)));
          const commentData = snapshot.docs.map((doc) => doc.data()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setAllComments(commentData);
        }
      } catch (err) {
        console.error("TVDetail Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
    fetchTVData();
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
    const data = snapshot.docs.map((doc) => doc.data()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setAllComments(data);
  };

  if (loading || !tv) return <ShimmerDetail />;

return (
<div className="relative z-10 bg-white/80 dark:bg-black/70 backdrop-blur-sm min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 pb-6">


{tv?.backdrop_path && (
  <div className="fixed inset-0 z-0">
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{
        backgroundImage: `url(https://image.tmdb.org/t/p/original${tv.backdrop_path})`,
        filter: "brightness(0.85)",
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/70 to-white dark:from-black/80 dark:via-black/70 dark:to-black" />
  </div>
)}


    <div className="relative z-10 bg-white/80 dark:bg-black/70 backdrop-blur-sm min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-6">
       {/* TV Info */}
        <motion.div
          className="flex flex-col md:flex-row items-start gap-4 sm:gap-6 lg:gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex-shrink-0 w-56 sm:w-64 md:w-80 rounded-xl overflow-hidden shadow-2xl">
            <img
              src={
                tv.poster_path
                  ? `https://image.tmdb.org/t/p/w400${tv.poster_path}`
                  : "https://via.placeholder.com/400x600?text=No+Image"
              }
              alt={tv.name}
              className="w-full aspect-[2/3] object-cover rounded-xl"
              loading="lazy"
            />
          </div>
          <div className="flex-1 space-y-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:text-shadow">
              {tv.name}
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 text-gray-600 dark:text-gray-300">
              <p className="text-sm sm:text-base font-medium">
                {tv.first_air_date?.slice(0, 4)} • {tv.number_of_seasons} Season{tv.number_of_seasons > 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {tv.genres?.map((g) => (
                  <Link
                    to={`/tvshows?genre=${encodeURIComponent(g.name)}`}
                    key={g.id}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-700 transition"
                    aria-label={`Go to ${g.name} TV shows`}
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <span className="font-medium">TMDB:</span>
                <span className="text-yellow-500 font-bold">{tv.vote_average?.toFixed(1)}</span>
              </div>
              {omdbRatings.imdb && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">IMDb:</span>
                  <span className="text-yellow-400 font-bold">{omdbRatings.imdb}</span>
                </div>
              )}
              {omdbRatings.rt && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">RT:</span>
                  <span className="text-green-500 font-bold">{omdbRatings.rt}</span>
                </div>
              )}
              {omdbRatings.uncle && (
                <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-sm font-medium">
                  Uncle Score: {omdbRatings.uncle}/10
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <motion.button
                onClick={toggleWatchlist}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base font-medium transition-colors ${
                  isSaved
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isSaved ? "Remove from watchlist" : "Add to watchlist"}
              >
                <Bookmark className="w-4 sm:w-5 h-4 sm:h-5" />
                {isSaved ? "In Watchlist" : "Add to Watchlist"}
              </motion.button>
              <motion.select
                value={userRating}
                onChange={(e) => handleRating(Number(e.target.value))}
                disabled={!isSaved}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            </div>

            {watchmodeSources.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                <h4 className="w-full text-sm sm:text-base font-medium text-gray-600 dark:text-gray-300">
                  Stream on:
                </h4>
                {watchmodeSources.map((src) => (
                  <a
                    key={src.name}
                    href={src.web_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 transition"
                  >
                    <PlayCircle className="w-4 sm:w-5 h-4 sm:h-5" />
                    {src.name}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic mt-3 sm:mt-4 text-sm sm:text-base">
                Not available for streaming.
              </p>
            )}

<div className="text-sm sm:text-base leading-relaxed max-w-3xl p-6 rounded-lg bg-black/70 border border-yellow-400/50 shadow-xl">
  <p className="text-yellow-400 font-semibold drop-shadow-lg">
    {aiOverview}
  </p>
</div>
          </div>
        </motion.div>

        {/* Trailer */}
        {trailerUrl && (
          <motion.section
            className="mt-8 sm:mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-gray-900 dark:text-indigo-400 dark:text-shadow">
              <PlayCircle className="w-5 sm:w-6 h-5 sm:h-6" /> Watch Trailer
            </h3>
            <div className="relative overflow-hidden rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 aspect-video">
              <iframe
                src={trailerUrl}
                title="Trailer"
                className="w-full h-full rounded-xl"
                allowFullScreen
              />
            </div>
          </motion.section>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <motion.section
            className="mt-8 sm:mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-gray-900 dark:text-indigo-400 dark:text-shadow">
              <Users className="w-5 sm:w-6 h-5 sm:h-6" /> Cast
            </h2>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-200 dark:scrollbar-track-gray-800">
              {cast.map((member) => (
                <Link
                  key={member.id}
                  to={`/person/${member.id}`}
                  className="flex-shrink-0 w-36 sm:w-40 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-lg hover:shadow-xl transition"
                  aria-label={`View ${member.name} profile`}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
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
                      className="w-full h-44 sm:h-48 object-cover"
                      loading="lazy"
                    />
                    <p className="text-center p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 line-clamp-2">
                      {member.name}
                    </p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Related Shows */}
        {related.length > 0 && (
          <motion.section
            className="mt-8 sm:mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-gray-900 dark:text-indigo-400 dark:text-shadow">
              <PlayCircle className="w-5 sm:w-6 h-5 sm:h-6" /> Related Shows
            </h2>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-200 dark:scrollbar-track-gray-800">
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

        {/* Comments */}
        <motion.section
          className="mt-8 sm:mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-gray-900 dark:text-indigo-400 dark:text-shadow">
            <MessageCircle className="w-5 sm:w-6 h-5 sm:h-6" /> Comments
          </h2>
          {user && (
            <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-6">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[80px] sm:min-h-[100px]"
                aria-label="Comment input"
              />
              <motion.button
                onClick={submitComment}
                className="px-4 sm:px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm sm:text-base font-medium hover:bg-indigo-700 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Post comment"
              >
                Post Comment
              </motion.button>
            </div>
          )}
          {allComments.length > 0 ? (
            <ul className="space-y-3 sm:space-y-4">
              {allComments.slice(0, showAllComments ? undefined : 3).map((c) => (
                <motion.li
                  key={c.timestamp}
                  className="bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-md"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs sm:text-sm font-medium">
                      {c.userEmail.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">{c.userEmail}</p>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {c.comment}
                  </p>
                </motion.li>
              ))}
              {allComments.length > 0 && (
                <motion.button
                  onClick={() => setShowAllComments(!showAllComments)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm sm:text-base"
                  whileHover={{ scale: 1.05 }}
                  aria-label={showAllComments ? "Show fewer comments" : "Show all comments"}
                >
                  {showAllComments ? "Show Fewer" : `Show All (${allComments.length})`}
                </motion.button>
              )}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic text-sm sm:text-base">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}
        </motion.section>
      </div>

      <style jsx={true}>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #6366f1;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background-color: #e5e7eb;
        }
        .dark .scrollbar-thin::-webkit-scrollbar-track {
          background-color: #1f2937;
        }
        .dark .text-shadow {
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}

export default TVDetail;
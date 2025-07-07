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
import { db } from "../firebase";
import { auth } from "../firebase";
import { fetchOMDbData } from "../api/omdb";
import { calculateUncleScore } from "../utils/uncleScore";
import API_BASE from "../utils/api";

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
  const [omdbData, setOmdbData] = useState(null);
  const [uncleScore, setUncleScore] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const user = auth.currentUser;
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/tv/${id}`);
        const data = await res.json();
        setTV(data);

        const omdb = await fetchOMDbData(data.name);
        setOmdbData(omdb);
        const imdb = omdb?.imdbRating || 0;
        const rt = omdb?.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value || "0%";
        setUncleScore(calculateUncleScore(data.vote_average, imdb, rt));

        const trailerRes = await fetch(`${API_BASE}/api/tmdb/tv/${id}/videos`);
        const trailerData = await trailerRes.json();
        const trailer = trailerData.results.find((v) => v.type === "Trailer" && v.site === "YouTube");
        if (trailer) setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}`);

        const castRes = await fetch(`${API_BASE}/api/tmdb/tv/${id}/credits`);
        const castData = await castRes.json();
        setCast(castData.cast.slice(0, 8));

        const similarRes = await fetch(`${API_BASE}/api/tmdb/tv/${id}/similar`);
        const similarData = await similarRes.json();
        setRelated(similarData.results.slice(0, 10));

        const watchRes = await fetch(`${API_BASE}/api/watchmode/id?title=${encodeURIComponent(data.name)}`);
        const { id: watchmodeId } = await watchRes.json();

        if (watchmodeId) {
          const sourcesRes = await fetch(`${API_BASE}/api/watchmode/sources/${watchmodeId}`);
          const sources = await sourcesRes.json();
          setPlatforms(sources);
        }

        if (user) {
          const watchRef = doc(db, "watchlists", `${user.uid}_${id}_tv`);
          const watchSnap = await getDoc(watchRef);
          setIsSaved(watchSnap.exists());

          const rateRef = doc(db, "ratings", `${user.uid}_${id}_tv`);
          const rateSnap = await getDoc(rateRef);
          if (rateSnap.exists()) setUserRating(rateSnap.data().rating);
        }

        const q = query(collection(db, "comments"), where("tvId", "==", `${id}_tv`));
        const snapshot = await getDocs(q);
        const commentData = snapshot.docs.map((doc) => doc.data()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setAllComments(commentData);
      } catch (err) {
        console.error("TVDetail Error:", err);
      }
    };

    fetchAll();
  }, [id, user]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.opacity = "0.2";
    const particles = [];

    function createParticle(x, y) {
      particles.push({ x, y, opacity: 1, radius: 8 });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`;
        ctx.fill();
        ctx.closePath();
        p.opacity -= 0.01;
        if (p.opacity <= 0) particles.splice(i, 1);
      });
      requestAnimationFrame(animate);
    }

    document.addEventListener("mousemove", (e) => createParticle(e.clientX, e.clientY));
    animate();
    return () => document.removeEventListener("mousemove", createParticle);
  }, []);

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
        rating: tv.vote_average?.toFixed(1),
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

  if (!tv) {
  return (
    <div className="min-h-screen bg-black text-white flex items-start justify-center pt-32 px-4">
      <div className="w-full max-w-6xl animate-pulse space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-72 h-[420px] bg-gray-800 rounded-lg" />
          <div className="flex-1 space-y-4">
            <div className="h-10 bg-gray-700 rounded w-3/4" />
            <div className="h-5 bg-gray-700 rounded w-1/2" />
            <div className="flex gap-2 flex-wrap">
              {Array(5).fill().map((_, i) => (
                <div key={i} className="h-6 w-20 bg-gray-700 rounded-full" />
              ))}
            </div>
            <div className="h-4 bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-700 rounded w-5/6" />
            <div className="h-4 bg-gray-700 rounded w-2/3" />
          </div>
        </div>
        <div className="h-64 bg-gray-800 rounded-lg" />
      </div>
    </div>
  );
}


  return (
  <div className="relative min-h-screen text-white">
    {tv.backdrop_path && (
      <div
        className="fixed top-0 left-0 w-full h-full bg-cover bg-center filter blur-md opacity-50 -z-10"
        style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${tv.backdrop_path})` }}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    )}

    <div className="max-w-7xl mx-auto px-4 py-8 relative z-20 pt-20">
      {/* Poster and Details Side by Side */}
      <div className="flex flex-col md:flex-row items-start gap-8 animate-fadeIn">
        <div className="flex-shrink-0 w-full md:w-72 rounded-lg overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
          <img
            src={
              tv.poster_path
                ? `https://image.tmdb.org/t/p/w780${tv.poster_path}`
                : "https://via.placeholder.com/500x750?text=No+Image"
            }
            alt={tv.name}
            className="rounded-lg w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
        <div className="flex-1 space-y-4 animate-slideUp">
          <h1 className="text-4xl md:text-5xl font-bold tracking-wide drop-shadow-lg">
            {tv.name}
          </h1>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-6 text-gray-400">
            <p className="text-lg font-semibold">
              {tv.first_air_date?.slice(0, 4)} • {tv.episode_run_time?.[0] || "N/A"} mins
            </p>
            <div className="flex flex-wrap gap-2">
              {tv.genres?.map((g) => (
                <span
                  key={g.id}
                  className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-sm font-medium text-white shadow-md hover:shadow-lg transition-shadow"
                >
                  {g.name}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 text-gray-300">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">TMDB:</span>
              <span className="text-yellow-400 font-bold text-lg">
                {tv.vote_average?.toFixed(1)}
              </span>
              <span className="text-gray-500">({tv.vote_count} votes)</span>
            </div>
            {omdbData?.imdbRating && (
              <div className="flex items-center space-x-2">
                <span className="font-semibold">IMDb:</span>
                <span className="text-yellow-400 font-bold text-lg">
                  {omdbData.imdbRating}
                </span>
              </div>
            )}
            {omdbData?.Ratings && (
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Rotten Tomatoes:</span>
                <span className="text-yellow-400 font-bold text-lg">
                  {omdbData.Ratings.find((r) => r.Source === "Rotten Tomatoes")?.Value || "N/A"}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={toggleWatchlist}
              className={`px-4 py-2 rounded-full font-semibold transition-colors duration-300 ${
                isSaved ? "bg-green-600 hover:bg-green-700" : "bg-gray-700 hover:bg-gray-600"
              } transform hover:scale-105`}
            >
              {isSaved ? "In Watchlist ✅" : "Add to Watchlist"}
            </button>
            <select
              value={userRating}
              onChange={(e) => handleRating(Number(e.target.value))}
              disabled={!isSaved}
              className="bg-gray-800 px-4 py-2 rounded text-white cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <option value="0">Rate</option>
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  ⭐ {i + 1}
                </option>
              ))}
            </select>
          </div>
          <p className="text-md leading-relaxed text-gray-300 max-w-2xl">{tv.overview}</p>
          {platforms.length > 0 && (
            <>
              <h3 className="text-xl font-semibold mb-2 mt-4">Available On:</h3>
              <ul className="flex flex-wrap gap-2">
                {platforms.map((p) => (
                  <li
                    key={p.name}
                    className="bg-gray-800 px-3 py-1 rounded-full hover:bg-gray-700 transition transform hover:scale-105"
                  >
                    <a
                      href={p.web_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {p.name}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Trailer */}
      {trailerUrl && (
        <div className="mt-10">
          <h3 className="text-2xl font-semibold mb-4 animate-pulse">🎬 Watch Trailer</h3>
          <div className="relative overflow-hidden rounded-xl shadow-2xl border border-gray-700 transform hover:scale-102 transition-transform duration-300 aspect-video">
            <iframe
              src={trailerUrl}
              title="Trailer"
              className="w-full h-full rounded-lg"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Cast */}
      {cast.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold mb-4 animate-fadeIn">👥 Cast</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-800">
            {cast.map((member) => (
              <Link
                key={member.id}
                to={`/person/${member.id}`}
                className="flex-shrink-0 w-32 rounded-lg overflow-hidden bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <img
                  src={
                    member.profile_path
                      ? `https://image.tmdb.org/t/p/w300${member.profile_path}`
                      : "https://via.placeholder.com/300x450?text=No+Image"
                  }
                  alt={member.name}
                  className="w-full h-40 object-cover"
                  loading="lazy"
                />
                <p className="text-center p-2 text-sm font-medium text-gray-200">{member.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Related Shows */}
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold mb-4 animate-fadeIn">📽️ Related TV SHOWS</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-800">
            {related.map((m) => (
              <Link
                key={m.id}
                to={`/tv/${m.id}`}
                className="flex-shrink-0 w-48 rounded-lg overflow-hidden bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <img
                  src={
                    m.poster_path
                      ? `https://image.tmdb.org/t/p/w400${m.poster_path}`
                      : "https://via.placeholder.com/400x600?text=No+Image"
                  }
                  alt={m.name}
                  className="w-full h-64 object-cover"
                  loading="lazy"
                />
                <p className="text-center p-2 text-sm font-medium text-gray-200">{m.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Comments */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4 animate-fadeIn">💬 Comments</h2>
        {user && (
          <div className="flex gap-2 mb-6 animate-slideUp">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment..."
              className="flex-1 px-4 py-2 rounded-lg bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-white transition-all duration-300 hover:bg-gray-700"
            />
            <button
              onClick={submitComment}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-medium transition-all duration-300 transform hover:scale-105"
            >
              Post
            </button>
          </div>
        )}
        {allComments.length > 0 ? (
          <ul className="space-y-4">
            {allComments.map((c) => (
              <li
                key={c.timestamp}
                className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 animate-fadeInUp transform hover:-translate-y-1 hover:bg-gray-800"
              >
                <p className="text-xs text-gray-500 mb-1 font-semibold">{c.userEmail}</p>
                <p className="text-gray-300 whitespace-pre-line">{c.comment}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic text-sm animate-pulse">No comments yet.</p>
        )}
      </section>
    </div>

    {/* Styles */}
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

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        .animate-slideUp { animation: slideUp 0.6s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease-out; }
        .animate-pulse { animation: pulse 1.5s infinite; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}
    </style>
  </div>
);

}

export default TVDetail;

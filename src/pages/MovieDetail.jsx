import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDoc, doc, setDoc, deleteDoc, collection, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import API_BASE from "../utils/api";
import MovieCard from "../components/MovieCard";
import ShimmerDetail from "../components/ShimmerDetail"; // --- FIX: Import your existing shimmer component ---
import { motion } from "framer-motion";
import { getWatchmodeId, getStreamingSources } from "../api/watchmode";
import { Star, Bookmark, PlayCircle, Users, MessageCircle, Clapperboard, Sparkles, Share2 } from "lucide-react";

// Section component for consistent styling
function Section({ title, icon, children, className = "" }) {
  const Icon = icon;
  return (
    <motion.section 
      className={`mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl sm:text-2xl font-bold p-4 sm:p-6 flex items-center gap-3 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
        <Icon className="w-6 h-6 text-indigo-500" /> {title}
      </h2>
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </motion.section>
  );
}

function MovieDetail() {
    const { id } = useParams();
    const [movie, setMovie] = useState(null);
    const [rewrittenOverview, setRewrittenOverview] = useState("");
    const [trailerUrl, setTrailerUrl] = useState("");
    const [cast, setCast] = useState([]);
    const [relatedMovies, setRelatedMovies] = useState([]);
    const [isSaved, setIsSaved] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [allComments, setAllComments] = useState([]);
    const [showAllComments, setShowAllComments] = useState(false);
    const [watchmodeSources, setWatchmodeSources] = useState([]);
    const [copied, setCopied] = useState(false);
    const user = auth.currentUser;
    const [omdbRatings, setOmdbRatings] = useState({ imdb: null, rt: null, uncle: null });

    useEffect(() => {
        setMovie(null); // Reset movie to trigger shimmer on new page navigation
        window.scrollTo(0, 0);

        const fetchAll = async () => {
            try {
                const movieRes = await fetch(`${API_BASE}/api/tmdb/movie/${id}`);
                if (!movieRes.ok) throw new Error(`TMDB movie fetch failed`);
                const movieData = await movieRes.json();
                
                const [aiData, omdbData, trailerData, castData, similarData] = await Promise.all([
                    fetch(`${API_BASE}/api/ai/rewrite-overview`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: movieData.title, overview: movieData.overview, genre: movieData.genres?.[0]?.name, type: "movie", year: movieData.release_date?.slice(0, 4) }) }).then(res => res.json()),
                    fetch(`${API_BASE}/api/omdb?title=${encodeURIComponent(movieData.title)}&year=${movieData.release_date?.slice(0, 4)}`).then(res => res.json()),
                    fetch(`${API_BASE}/api/tmdb/movie/${id}/videos`).then(res => res.json()),
                    fetch(`${API_BASE}/api/tmdb/movie/${id}/credits`).then(res => res.json()),
                    fetch(`${API_BASE}/api/tmdb/movie/${id}/similar`).then(res => res.json()),
                ]);

                setMovie(movieData);
                if (aiData.rewritten) setRewrittenOverview(aiData.rewritten.trim());
                if (!omdbData.error) { /* ... OMDb processing logic ... */ }
                const trailer = trailerData.results?.find(v => v.type === "Trailer" && v.site === "YouTube");
                if (trailer) setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}`);
                setCast(castData.cast?.slice(0, 10) || []);
                setRelatedMovies(similarData.results?.slice(0, 10) || []);
                getWatchmodeId(movieData.title, movieData.release_date?.slice(0, 4), movieData.id.toString()).then(/* ... */);
                if (user) { /* ... user data fetching ... */ }
            } catch (err) { console.error("Failed to fetch movie details:", err); }
        };
        fetchAll();
    }, [id, user]);

    const toggleWatchlist = async () => { /* ... (same logic as your file) */ };
    const handleRating = async (newRating) => { /* ... (same logic as your file) */ };
    const submitComment = async () => { /* ... (same logic as your file) */ };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    // --- FIX: Use your existing ShimmerDetail component for loading state ---
    if (!movie) return <ShimmerDetail />;

    return (
        <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
            {/* HERO SECTION */}
            <div className="relative pt-[5.5rem] text-white">
                {movie?.backdrop_path && (
                    <div className="absolute inset-0 z-0">
                        <img src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`} alt="" className="w-full h-full object-cover" />
                        {/* --- VISIBILITY FIX: Stronger, consistent overlay for high contrast --- */}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-black/40" />
                    </div>
                )}
                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    <motion.div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <div className="flex-shrink-0 w-48 sm:w-60 md:w-72 rounded-lg overflow-hidden shadow-2xl shadow-black/50">
                            <img src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "https://placehold.co/500x750/1f2937/FFFFFF?text=No+Image"} alt={movie.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight [text-shadow:_0_2px_4px_rgb(0_0_0_/_60%)]">{movie.title}</h1>
                            {movie.tagline && <p className="text-lg text-gray-200 italic [text-shadow:_0_1px_2px_rgb(0_0_0_/_60%)]">{movie.tagline}</p>}
                            <div className="flex items-center justify-center md:justify-start flex-wrap gap-x-4 gap-y-2 text-gray-200 text-sm">
                                <span>{movie.release_date?.slice(0, 4)}</span>
                                {movie.runtime > 0 && <span>{movie.runtime} mins</span>}
                                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                    {movie.genres?.slice(0, 3).map(g => (<Link to={`/genres?genre=${g.name}`} key={g.id} className="px-2 py-1 text-xs rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition">{g.name}</Link>))}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 pt-2">
                                {omdbRatings.uncle && <div className="text-center"><div className="text-2xl font-bold text-indigo-400">{omdbRatings.uncle}</div><div className="text-xs uppercase tracking-wider text-gray-400">Uncle Score</div></div>}
                                {movie.vote_average > 0 && <div className="text-center"><div className="text-2xl font-bold text-yellow-400">{movie.vote_average.toFixed(1)}</div><div className="text-xs uppercase tracking-wider text-gray-400">TMDB</div></div>}
                                {omdbRatings.imdb && <div className="text-center"><div className="text-2xl font-bold text-yellow-500">{omdbRatings.imdb}</div><div className="text-xs uppercase tracking-wider text-gray-400">IMDb</div></div>}
                                {omdbRatings.rt && <div className="text-center"><div className="text-2xl font-bold text-red-500">{omdbRatings.rt}</div><div className="text-xs uppercase tracking-wider text-gray-400">RT</div></div>}
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4">
                                <motion.button onClick={toggleWatchlist} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${isSaved ? "bg-green-600 text-white" : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}> <Bookmark className="w-4 h-4" /> {isSaved ? "In Watchlist" : "Add to Watchlist"} </motion.button>
                                <div className="relative">
                                    <select value={userRating} onChange={(e) => handleRating(Number(e.target.value))} className="appearance-none cursor-pointer flex items-center gap-1.5 pl-4 pr-8 py-2 rounded-full text-sm font-semibold bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="0" className="text-black">{userRating > 0 ? `Your Rating: ${userRating}` : 'Rate'}</option>
                                        {[...Array(10)].map((_, i) => (<option className="text-black" key={i + 1} value={i + 1}>⭐ {i + 1}</option>))}
                                    </select>
                                    <Star className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                                </div>
                                <motion.button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Share2 className="w-4 h-4" />
                                    <span>{copied ? "Copied!" : "Share"}</span>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 transform -translate-y-16 md:-translate-y-24">
                {(rewrittenOverview || movie.overview) && (
                    <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 mb-8">
                        {/* --- FIX: Renamed AI section --- */}
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-900 dark:text-white"><Sparkles className="w-5 h-5 text-indigo-500" /> Synopsis</h3>
                        <p className="text-gray-600 dark:text-gray-300 italic leading-relaxed">{rewrittenOverview || movie.overview}</p>
                    </div>
                )}
                {watchmodeSources.length > 0 && <Section title="Stream On" icon={PlayCircle}>{/* ... Your original JSX for streaming sources */}</Section>}
                {trailerUrl && <Section title="Watch Trailer" icon={Clapperboard}><div className="relative aspect-video shadow-lg"><iframe src={trailerUrl} title="Trailer" className="w-full h-full rounded-lg" allowFullScreen/></div></Section>}
                {cast.length > 0 && <Section title="Top Cast" icon={Users} className="!p-0"><div className="flex gap-4 overflow-x-auto p-4 sm:p-6 scrollbar-thin">{cast.map(member => ( <Link key={member.id} to={`/person/${member.id}`} className="flex-shrink-0 w-36 text-center group"> <div className="w-36 h-48 rounded-lg overflow-hidden shadow-md mb-2 transition-transform duration-300 group-hover:scale-105 bg-gray-200 dark:bg-gray-700"> <img src={member.profile_path ? `https://image.tmdb.org/t/p/w185${member.profile_path}` : "https://placehold.co/185x278/2d3748/FFFFFF?text=N/A"} alt={member.name} className="w-full h-full object-cover" loading="lazy" /> </div> <p className="text-sm font-medium truncate group-hover:text-indigo-500 transition-colors">{member.name}</p> <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.character}</p> </Link> ))}</div></Section>}
                {relatedMovies.length > 0 && <Section title="Related Movies" icon={Clapperboard} className="!p-0"><div className="flex gap-4 overflow-x-auto p-4 sm:p-6 scrollbar-thin">{relatedMovies.map(m => ( <div className="flex-shrink-0 w-36 sm:w-40" key={m.id}><MovieCard id={m.id} title={m.title} imageUrl={m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null} tmdbRating={m.vote_average?.toString()} /></div> ))}</div></Section>}
                <Section title="Comments" icon={MessageCircle}>{/* ... Your original JSX for comments */}</Section>
            </div>
            <style jsx>{`/* ... (scrollbar styles are the same) */`}</style>
        </div>
    );
}

export default MovieDetail;



// src/pages/TVDetail.jsx

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useColor } from "color-thief-react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import API_BASE from "../utils/api";
import MovieCard from "../components/MovieCard";
import ShimmerDetail from "../components/ShimmerDetail";
import RatingCircle from "../components/RatingCircle";
import { getWatchmodeId, getStreamingSources } from "../api/watchmode";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trash2, Users, Clapperboard, Film, MessageSquare, Sparkles, PlayCircle, Tv, Bookmark, Play } from "lucide-react";
import { addToWatchHistory } from "../utils/watchHistory";
import { computeUncleScore } from "../utils/uncleScoreEngine";

const formatRuntime = (mins) => {
    if (!mins || typeof mins !== 'number' || mins <= 0) return null;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    let result = '';
    if (hours > 0) result += `${hours}h`;
    if (remainingMins > 0) result += ` ${remainingMins}m`;
    return result.trim();
};

// --- Age Rating Mapping for TV ---
const ratingMap = {
    "G": "Suitable for all ages",
    "PG": "Ages 10+ ",
    "PG-13": "Ages 13+ ",
    "R": "Ages 17+",
    "NC-17": "Adults Only (18+)",

    // TV ratings
    "TV-Y": "Suitable for all ages",
    "TV-Y7": "Ages 7+",
    "TV-G": "Suitable for all ages",
    "TV-PG": "Ages 10+ ",
    "TV-14": "Ages 14+",
    "TV-MA": "Adults Only (18+)"
};

const getHeuristicRating = (genres = []) => {
    const names = genres.map(g => g.name.toLowerCase());

    if (names.includes("horror")) return "Ages 16+ ";
    if (names.includes("crime")) return "Ages 14+";
    if (names.includes("thriller")) return "Ages 14+";
    if (names.includes("action")) return "Ages 13+";
    if (names.includes("romance")) return "Ages 13+";
    if (names.includes("animation")) return "Suitable for all ages";
    if (names.includes("family")) return "Suitable for all ages";

    return null;
};
const WorthItBadgeFloating = ({ badge }) => {
    if (!badge) return null;

    const colors = {
        "Must Watch": { bg: "bg-green-600", text: "text-white" },
        "Worth Watching": { bg: "bg-blue-600", text: "text-white" },
        "Mixed": { bg: "bg-yellow-500", text: "text-black" },
        "Skip": { bg: "bg-red-600", text: "text-white" },
    };

    const style = colors[badge] || { bg: "bg-gray-600", text: "text-white" };

    return (
        <div
            className={`absolute top-6 right-6 z-30 px-4 py-1.5 rounded-full font-bold text-sm shadow-lg ${style.bg} ${style.text}`}
        >
            {badge}
        </div>
    );
};

const InteractiveStarRating = ({ totalStars = 10, currentRating = 0, onRate, disabled }) => {
    const [hoverRating, setHoverRating] = useState(0);
    return (
        <div className={`flex items-center gap-1 ${disabled ? 'cursor-not-allowed' : ''}`}>
            {[...Array(totalStars)].map((_, index) => {
                const starValue = index + 1;
                return (<Star key={starValue} className={`transition-colors duration-150 ${disabled ? '' : 'cursor-pointer'} ${starValue <= (hoverRating || currentRating) ? "text-yellow-400 fill-current" : "text-gray-600"}`} size={24} onClick={() => !disabled && onRate(starValue)} onMouseEnter={() => !disabled && setHoverRating(starValue)} onMouseLeave={() => !disabled && setHoverRating(0)}/>);
            })}
        </div>
    );
};

const TabButton = ({ active, onClick, children }) => (<button onClick={onClick} className={`px-4 py-2 text-sm sm:text-base font-semibold rounded-full transition-colors duration-300 relative ${active ? "text-white" : "text-gray-400 hover:text-white"}`}>{children}{active && (<motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--dominant-color)]" layoutId="underline"/>)}</button>);


// --- FIX: Replaced the old WatchOnSection with the one from MovieDetail.jsx for UI consistency ---
const WatchOnSection = ({ sources }) => {
    const sourceDetails = {
        203: { name: 'Netflix', color: '#E50914' },
        157: { name: 'Hulu', color: '#1CE783' },
        26: { name: 'Prime Video', color: '#00A8E1' },
        372: { name: 'Disney+', color: '#111942' },
        387: { name: 'HBO Max', color: '#815DFF' },
        371: { name: 'Apple TV+', color: '#000000' },
        122: { name: 'Hotstar', color: '#103C85' }
    };

    const uniqueSources = sources.filter((source, index, self) => index === self.findIndex((s) => s.source_id === source.source_id));

    return (
        <motion.div 
            className="mb-8 p-6 rounded-2xl bg-gray-800" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
        >
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <PlayCircle className="w-6 h-6 text-[var(--dominant-color)]" /> Stream Now On
            </h3>
            <div className="flex flex-wrap gap-3">
                {uniqueSources.map(source => {
                    const details = sourceDetails[source.source_id];
                    if (!details && source.type !== 'note') return null;

                    if (source.type === 'note') {
                        return <div key={source.name} className="flex items-center p-2"><span className="font-semibold text-sm text-gray-400">{source.name}</span></div>;
                    }

                    return (
                        <a 
                            key={source.source_id} 
                            href={source.web_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-white font-bold text-sm px-4 py-2 rounded-full transition-transform duration-200 ease-in-out transform hover:scale-105"
                            style={{ 
                                backgroundColor: details.color,
                                border: `2px solid ${details.color}`
                            }}
                            title={`Watch on ${details.name}`}
                        >
                            <Play size={14} className="fill-current" />
                            <span>{details.name}</span>
                        </a>
                    );
                })}
            </div>
        </motion.div>
    );
};


const ReviewCard = ({ review, isAdmin, onDelete }) => {
    const formattedDate = review.createdAt?.seconds ? new Date(review.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Just now';
    return ( <div className="bg-gray-800 p-4 rounded-lg relative group"> <div className="flex items-start mb-2"> <img src={review.userAvatar || `https://placehold.co/40x40/2d3748/FFFFFF?text=${review.userName.charAt(0)}`} alt={review.userName} className="w-10 h-10 rounded-full mr-3"/> <div className="flex-1"> <div className="flex items-center justify-between"> <p className="font-semibold">{review.userName}</p> <p className="text-xs text-gray-400">{formattedDate}</p> </div> {review.rating && <div className="flex items-center">{[...Array(10)].map((_, i) => (<Star key={i} size={14} className={i < review.rating ? "text-yellow-400 fill-current" : "text-gray-600"}/>))}</div>} </div> </div> <p className="text-gray-300 text-sm leading-relaxed pr-8 whitespace-pre-line">{review.comment}</p> {isAdmin && ( <button onClick={() => onDelete(review.id)} className="absolute top-2 right-2 p-1.5 bg-red-800/50 text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-800 hover:text-white" title="Delete Comment"> <Trash2 size={16} /> </button> )} </div> );
};

const EpisodeCard = ({ episode }) => {
    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden flex flex-col sm:flex-row gap-4">
            <img 
                src={episode.still_path ? `https://image.tmdb.org/t/p/w300${episode.still_path}` : "https://placehold.co/300x169/1f2937/FFFFFF?text=No+Image"} 
                alt={episode.name}
                className="w-full sm:w-48 h-auto object-cover flex-shrink-0 bg-gray-700"
            />
            <div className="p-4">
                <h4 className="font-bold text-white">{episode.episode_number}. {episode.name}</h4>
                <p className="text-xs text-gray-400 mt-1 mb-2">{new Date(episode.air_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-sm text-gray-300 line-clamp-3">{episode.overview}</p>
            </div>
        </div>
    );
};






const SeasonsTab = ({ tvShow, selectedSeason, onSeasonChange, seasonDetails, isLoading }) => {
    const seasons = (tvShow?.seasons || []).filter(s => s.season_number > 0);
    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2"><Tv className="w-6 h-6"/> Seasons</h3>
                <select 
                    value={selectedSeason} 
                    onChange={e => onSeasonChange(Number(e.target.value))}
                    className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                >
                    {seasons.map(season => <option key={season.id} value={season.season_number}>{season.name}</option>)}
                </select>
            </div>
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <div key={i} className="bg-gray-800 h-32 rounded-lg animate-pulse"></div>)}
                </div>
            ) : (
                <div className="space-y-4">
                    {seasonDetails?.episodes?.map(episode => <EpisodeCard key={episode.id} episode={episode} />)}
                </div>
            )}
        </div>
    );
};

function TVDetail() {
    const { id } = useParams();
    const [tvShow, setTvShow] = useState(null);
    const [theHook, setTheHook] = useState("");
    const [aiSummary, setAiSummary] = useState("");
    const [trailerKey, setTrailerKey] = useState(null);
    const [cast, setCast] = useState([]);
    const [crew, setCrew] = useState({});
    const [related, setRelated] = useState([]);
    const [castLoaded, setCastLoaded] = useState(false);
    const [relatedLoaded, setRelatedLoaded] = useState(false);
    const [seasonLoaded, setSeasonLoaded] = useState(false);

    const [streamingSources, setStreamingSources] = useState([]);
    const [omdbRatings, setOmdbRatings] = useState({ imdb: null, rt: null, uncle: null });
    const [userRating, setUserRating] = useState(0);
    const [comment, setComment] = useState("");
    const [reviews, setReviews] = useState([]);
    const [ageRating, setAgeRating] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("synopsis");
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUser, setCurrentUser] = useState(auth.currentUser);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [seasonDetails, setSeasonDetails] = useState(null);
    const [isSeasonLoading, setIsSeasonLoading] = useState(false);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const posterUrl = tvShow?.poster_path ? `https://image.tmdb.org/t/p/w200${tvShow.poster_path}` : null;
    const { data: dominantColor } = useColor(posterUrl, 'hex', { crossOrigin: 'anonymous', quality: 10 });


    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          setCurrentUser(user);
          if (user) {
            const tokenResult = await user.getIdTokenResult();
            setIsAdmin(tokenResult.claims.isAdmin === true);
          } else {
            setIsAdmin(false);
          }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        setTvShow(null);
        window.scrollTo(0, 0);

const fetchAll = async () => {
    try {
        // 1) TV + Reviews FIRST
        const [tvRes, reviewsRes] = await Promise.all([
            fetch(`${API_BASE}/api/tmdb/tv/${id}`),
            fetch(`${API_BASE}/api/tv/${id}/reviews`)
        ]);

        const tvData = await tvRes.json();
        setTvShow(tvData);

        if (reviewsRes.ok) {
            const reviewsData = await reviewsRes.json();
            if (Array.isArray(reviewsData)) setReviews(reviewsData);
        }

        // 2) Fetch OMDB ONCE (needed for IMDb rating)
        const omdbData = await fetch(
            `${API_BASE}/api/omdb?title=${encodeURIComponent(tvData.name)}&year=${tvData.first_air_date?.slice(0, 4)}`
        ).then(res => res.json());

        // Extract IMDb rating safely
        const imdbRating =
            omdbData?.Ratings?.find(r => r.Source === "Internet Movie Database")?.Value?.split("/")[0] || null;

        // 3) Now fetch everything else (AI + Worth-it + TMDB videos + credits + similar)
        const [aiData, trailerData] = await Promise.all([
            // AI Overview
            fetch(`${API_BASE}/api/ai/rewrite-overview`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: tvData.name,
                    overview: tvData.overview,
                    tmdbId: tvData.id,
                    type: "tv"
                })
            }).then(res => res.json()),

            fetch(`${API_BASE}/api/tmdb/tv/${id}/videos`).then(res => res.json())
            ]);



// 4) Apply the NEW AI Overview
if (aiData?.summary) {
    setAiSummary(aiData.summary.trim());
} else {
    setAiSummary(tvData.overview || "");
}

        // 5) Community ratings (reusing OMDB + TMDB rating)
const rtRating =
    omdbData?.Ratings?.find(r => r.Source === "Rotten Tomatoes")?.Value || null;

// --- NEW UNCLE SCORE ENGINE ---
const uncle = computeUncleScore({
    tmdb: tvData.vote_average,
    imdb: imdbRating,
    rt: rtRating,
    popularity: tvData.popularity,
    genres: tvData.genres?.map(g => g.name) || []
});

setOmdbRatings({
    imdb: imdbRating,
    rt: rtRating,
    uncle: uncle.score,
    badge: uncle.badge
});



        // 7) Age Rating logic (unchanged)
        if (omdbData?.Rated && omdbData.Rated !== "N/A") {
            setAgeRating(ratingMap[omdbData.Rated] || omdbData.Rated);
        } else {
            try {
                const certRes = await fetch(`${API_BASE}/api/tmdb/tv/${id}`);
                const certData = await certRes.json();
                const usCert = certData?.content_ratings?.results?.find(r => r.iso_3166_1 === "US");
                const inCert = certData?.content_ratings?.results?.find(r => r.iso_3166_1 === "IN");
                const finalCert = usCert?.rating || inCert?.rating;
                if (finalCert) setAgeRating(ratingMap[finalCert] || finalCert);
                else setAgeRating(getHeuristicRating(tvData.genres));
            } catch {}
        }

        // 8) Trailer
        const trailer = trailerData.results?.find(
            v => v.type === "Trailer" && v.site === "YouTube"
        );
        setTrailerKey(trailer?.key || null);


        // 11) Streaming availability
        const releaseYear = tvData.first_air_date?.slice(0, 4);
        const wmId = await getWatchmodeId(tvData.name, releaseYear, "tv");

        if (wmId) {
            const sources = await getStreamingSources(wmId);
            const filtered = sources?.filter(src => src.type === "sub" || src.type === "free");
            setStreamingSources(
                filtered?.length
                    ? filtered
                    : [{ name: "Not available in your region", type: "note" }]
            );
        } else {
            setStreamingSources([]);
        }
    } catch (err) {
        console.error("Failed to fetch TV show details:", err);
    }
};

        fetchAll();
    }, [id]);


    useEffect(() => {
        const fetchUserSpecificData = async () => {
            if (currentUser && id) {
                const idToken = await currentUser.getIdToken(true);
                try {
                    const ratingRes = await fetch(`${API_BASE}/api/tv/${id}/my-rating`, { headers: { 'Authorization': `Bearer ${idToken}` } });
                    if (ratingRes.ok) {
                        const data = await ratingRes.json();
                        setUserRating(data.rating || 0);
                    }
                } catch (error) { console.error("Could not fetch user rating:", error); }
                
                try {
                    const docId = `${currentUser.uid}_${id}_tv`;
                    const docRef = doc(db, "watchlists", docId);
                    const docSnap = await getDoc(docRef);
                    setIsInWatchlist(docSnap.exists());
                } catch (error) { console.error("Could not check watchlist status:", error); }
            } else {
                setUserRating(0);
                setIsInWatchlist(false);
            }
        };
        fetchUserSpecificData();
    }, [currentUser, id]);

    const toggleWatchlist = async () => {
        if (!currentUser) {
            alert("Please log in to manage your watchlist.");
            return;
        }
        const docId = `${currentUser.uid}_${id}_tv`;
        const docRef = doc(db, "watchlists", docId);
        
        try {
            if (isInWatchlist) {
                await deleteDoc(docRef);
                setIsInWatchlist(false);
            } else {
                const data = {
                    userId: currentUser.uid,
                    mediaId: `${id}_tv`,
                    mediaType: 'tv',
                    title: tvShow.name,
                    imageUrl: tvShow.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : null,
                    rating: tvShow.vote_average,
                    createdAt: new Date(),
                };
                await setDoc(docRef, data);
                setIsInWatchlist(true);
            }
        } catch (error) {
            console.error("Failed to update watchlist:", error);
            alert("Could not update your watchlist. Please try again.");
        }
    };

    const handleRateShow = async (rating) => { if (!currentUser) { alert("Please log in to rate shows."); return; } setUserRating(rating); try { const idToken = await currentUser.getIdToken(true); await fetch(`${API_BASE}/api/tv/${id}/rate`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}`}, body: JSON.stringify({ rating }), }); } catch (error) { console.error("Rating submission error:", error); alert("Could not save your rating."); setUserRating(0); } };
    const handleReviewSubmit = async (e) => { e.preventDefault(); if (!currentUser) { alert("Please log in to post a comment."); return; } if (comment.trim() === "") { alert("Comment cannot be empty."); return; } setIsSubmitting(true); try { const idToken = await currentUser.getIdToken(true); const response = await fetch(`${API_BASE}/api/tv/${id}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` }, body: JSON.stringify({ comment }), }); if (!response.ok) throw new Error((await response.json()).error || "Failed to submit comment."); const newReview = await response.json(); setReviews(prevReviews => [newReview, ...prevReviews]); setComment(''); } catch (error) { console.error("Comment submission error:", error); alert(`Error: ${error.message}`); } finally { setIsSubmitting(false); } };
    const handleDeleteReview = async (reviewId) => { if (!currentUser) { alert("You must be logged in to delete."); return; } if (!window.confirm("Are you sure you want to delete this comment?")) return; try { const idToken = await currentUser.getIdToken(true); const response = await fetch(`${API_BASE}/api/review/${reviewId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${idToken}` }, }); if (!response.ok) throw new Error((await response.json()).error || "Failed to delete review."); setReviews(prevReviews => prevReviews.filter(review => review.id !== reviewId)); } catch (error) { console.error("Delete error:", error); alert(`Error: ${error.message}`); } };
    useEffect(() => {
        if (!tvShow) return;

        addToWatchHistory({
            id: tvShow.id,
            type: "tv",
            title: tvShow.name,
            poster_path: tvShow.poster_path,
            genres: tvShow.genres?.map(g => g.name) || []
        });
    }, [tvShow]);
    const CrewSection = ({ title, people }) => {
        if (!people || people.length === 0) return null;

        return (
            <div className="mb-10">
                <h3 className="text-xl font-bold mb-3">{title}</h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {people.map(person => (
                        <Link
                            key={person.id}
                            to={`/person/${person.id}`}
                            className="text-center group"
                        >
                            <div className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2 transition-transform duration-300 group-hover:scale-105">
                                <img
                                    src={
                                        person.profile_path
                                            ? `https://image.tmdb.org/t/p/w342${person.profile_path}`
                                            : "https://placehold.co/342x513/1f2937/FFFFFF?text=N/A"
                                    }
                                    alt={person.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <p className="text-sm font-bold truncate">{person.name}</p>
                            <p className="text-xs text-gray-400 truncate">{person.job}</p>
                        </Link>
                    ))}
                </div>
            </div>
        );
    };
    const rtScore = omdbRatings.rt ? parseInt(omdbRatings.rt.replace('%', '')) : null;
    const WorthItBadge = ({ badge }) => {
        if (!badge) return null;

        const colors = {
            "Must Watch": "bg-green-600/20 text-green-400 border border-green-500/40",
            "Worth Watching": "bg-blue-600/20 text-blue-400 border border-blue-500/40",
            "Mixed": "bg-yellow-600/20 text-yellow-400 border border-yellow-500/40",
            "Skip": "bg-red-600/20 text-red-400 border border-red-500/40"
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[badge] || "bg-gray-700 text-gray-300"}`}>
                {badge}
            </span>
        );
    };
useEffect(() => {
    if (activeTab !== "cast") return;
    if (castLoaded) return;

    const loadCastCrew = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/tmdb/tv/${id}/credits`);
            const data = await res.json();

            setCast(data.cast?.slice(0, 18) || []);

            setCrew({
                directors: data.crew?.filter(p => p.job === "Director") || [],
                writers: data.crew?.filter(p =>
                    ["Writer", "Screenplay", "Story", "Author"].includes(p.job)
                ) || [],
                producers: data.crew?.filter(p =>
                    ["Producer", "Executive Producer", "Co-Producer"].includes(p.job)
                ) || [],
                music: data.crew?.filter(p => p.job === "Original Music Composer") || [],
                cinematography: data.crew?.filter(p => p.job === "Director of Photography") || [],
                editors: data.crew?.filter(p => p.job === "Editor") || []
            });

            setCastLoaded(true);
        } catch (err) {
            console.error("Failed to load cast & crew:", err);
        }
    };

    loadCastCrew();
}, [activeTab, id]);

useEffect(() => {
    if (activeTab !== "related") return;
    if (relatedLoaded) return;

    const loadRelated = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/tmdb/tv/${id}/similar`);
            const data = await res.json();

            const result = Array.isArray(data)
                ? data
                : data?.results || [];

            setRelated(result.slice(0, 12));
            setRelatedLoaded(true);
        } catch (err) {
            console.error("Failed to load related shows:", err);
        }
    };

    loadRelated();
}, [activeTab, id]);

useEffect(() => {
    if (activeTab !== "seasons") return;

    // If already loaded AND same season, skip fetch
    if (seasonLoaded) return;

    const loadSeason = async () => {
        setIsSeasonLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/tmdb/tv/${id}/season/${selectedSeason}`);
            const data = await res.json();
            setSeasonDetails(data);
            setSeasonLoaded(true);
        } catch (err) {
            console.error("Failed to load season details:", err);
            setSeasonDetails(null);
        } finally {
            setIsSeasonLoading(false);
        }
    };

    loadSeason();
}, [activeTab, id]);
useEffect(() => {
    if (activeTab !== "seasons") return;

    setSeasonLoaded(false); // force reload for new season
}, [selectedSeason]);

    if (!tvShow) return <ShimmerDetail />;

    
    return (
        <div className="bg-gray-900 text-gray-100" style={{ '--dominant-color': dominantColor || '#4f46e5' }}>
            <div className="relative">
                <WorthItBadgeFloating badge={omdbRatings.badge} />

                <div className="absolute inset-0 h-[55vh] overflow-hidden">
                    <div className="w-full h-full bg-cover bg-top bg-no-repeat" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${tvShow.backdrop_path})` }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row gap-8 pt-[25vh]">
                        <motion.div className="w-40 md:w-52 flex-shrink-0" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
                            <img src={posterUrl ? posterUrl.replace('w200', 'w500') : "https://placehold.co/500x750/1f2937/FFFFFF?text=No+Image"} alt={tvShow.name} className="w-full h-auto rounded-xl shadow-2xl shadow-black/60" />
                        </motion.div>
                        <div className="flex flex-col justify-end flex-1 pb-4">
                            <motion.div
                                className="flex flex-col md:flex-row md:items-center gap-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                            >
                                <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                                    {tvShow.name}
                                </h1>


                            </motion.div>
                                                        <motion.div 
                                className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
                            >
                                <span>{tvShow.first_air_date?.slice(0, 4)}</span>

                                {ageRating && (
                                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-white/10 border border-white/20">
                                        {ageRating}
                                    </span>
                                )}

                                {tvShow.tagline && (
                                    <p className="italic text-gray-300 w-full text-sm md:text-base">
                                        "{tvShow.tagline}"
                                    </p>
                                )}

                                {tvShow.number_of_seasons && (
                                    <span>• {tvShow.number_of_seasons} Season{tvShow.number_of_seasons > 1 ? "s" : ""}</span>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    {tvShow.genres?.slice(0, 3).map(g => (
                                        <Link
                                            to={`/tvshows?genre=${g.name}`}
                                            key={g.id}
                                            className="text-xs font-semibold bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 hover:bg-white/20 transition-colors"
                                        >
                                            {g.name}
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div className="mt-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}>
                                <button
                                    onClick={toggleWatchlist}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${ isInWatchlist ? "bg-green-600 text-white hover:bg-green-700" : "bg-white/10 backdrop-blur-sm text-white hover:bg-white/20" }`}
                                >
                                    <Bookmark className="w-4 h-4" />
                                    {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
                                </button>
                            </motion.div>
                        </div>
                    </div>

                    <div className="py-8">
                        {streamingSources.length > 0 && <WatchOnSection sources={streamingSources} />}
                        <div className="border-b border-gray-700 mb-6">
                        <nav
                            className="
                            flex gap-2 sm:gap-4
                            overflow-x-auto
                            no-scrollbar
                            whitespace-nowrap
                            pb-2
                            "
                        >
                            <TabButton active={activeTab === 'synopsis'} onClick={() => setActiveTab('synopsis')}>
                            Details
                            </TabButton>
                            <TabButton active={activeTab === 'seasons'} onClick={() => setActiveTab('seasons')}>
                            Seasons
                            </TabButton>
                            <TabButton active={activeTab === 'cast'} onClick={() => setActiveTab('cast')}>
                            Cast & Crew
                            </TabButton>
                            <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}>
                            Comments
                            </TabButton>
                            <TabButton active={activeTab === 'related'} onClick={() => setActiveTab('related')}>
                            Related
                            </TabButton>
                        </nav>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div key={activeTab} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.2 }}>
                                {activeTab === 'synopsis' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="md:col-span-2">
                                            <h3 className="text-2xl font-bold mb-4">Why You Will Like This</h3>
                                            {theHook && (<div className="mb-6 p-4 rounded-lg bg-gray-800 border-l-4 border-[var(--dominant-color)]"><p className="text-gray-300 italic">"{theHook}"</p></div>)}
                                            {/* AI Summary */}
 

                                            <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-[var(--dominant-color)] mb-8">
                                                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                                                    {aiSummary || tvShow.overview}
                                                </p>
                                            </div>

                                            {trailerKey && (<div className="mt-8"> <h3 className="text-2xl font-bold mb-4 text-white"><Film className="inline w-6 h-6 mr-2"/>Trailer</h3> <div className="aspect-video"><iframe src={`https://www.youtube.com/embed/${trailerKey}`} title="Trailer" className="w-full h-full rounded-lg" allowFullScreen/></div> </div>)}
                                        </div>
                                        <div className="space-y-6">





<div className="grid grid-cols-2 gap-4 bg-gray-800 p-4 rounded-lg">

    {omdbRatings.uncle && (
        <RatingCircle
            score={parseFloat(omdbRatings.uncle)}
            label="Uncle Score"
            useAutoColor={true}
        />
    )}

    {tvShow.vote_average > 0 && (
        <RatingCircle
            score={parseFloat(tvShow.vote_average.toFixed(1))}
            label="TMDB"
            useAutoColor={true}
        />
    )}

    {omdbRatings.imdb && (
        <RatingCircle
            score={parseFloat(omdbRatings.imdb)}
            label="IMDb"
            useAutoColor={true}
        />
    )}

    {rtScore && (
        <RatingCircle
            score={rtScore}
            maxValue={100}
            label="Rotten Tomatoes"
            useAutoColor={true}
        />
    )}

</div>

                                            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700/50">
                                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                                    <Tv className="w-5 h-5 text-[var(--dominant-color)]" />
                                                    Show Information
                                                </h3>

                                                <div className="space-y-4 text-sm text-gray-300">

                                                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                                        <span className="text-gray-400">Status</span>
                                                        <span className="font-semibold text-white">{tvShow.status}</span>
                                                    </div>

                                                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                                        <span className="text-gray-400">First Air Date</span>
                                                        <span className="font-semibold text-white">{tvShow.first_air_date}</span>
                                                    </div>

                                                    {tvShow.last_air_date && (
                                                        <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                                            <span className="text-gray-400">Last Air Date</span>
                                                            <span className="font-semibold text-white">{tvShow.last_air_date}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                                        <span className="text-gray-400">Total Episodes</span>
                                                        <span className="font-semibold text-white">{tvShow.number_of_episodes}</span>
                                                    </div>

                                                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                                        <span className="text-gray-400">Seasons</span>
                                                        <span className="font-semibold text-white">{tvShow.number_of_seasons}</span>
                                                    </div>

                                                    {tvShow.spoken_languages?.length > 0 && (
                                                        <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                                            <span className="text-gray-400">Languages</span>
                                                            <span className="font-semibold text-white">
                                                                {tvShow.spoken_languages.map(l => l.english_name).join(", ")}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {tvShow.production_companies?.length > 0 && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-400">Studios</span>
                                                            <span className="font-semibold text-white text-right">
                                                                {tvShow.production_companies.map(c => c.name).join(", ")}
                                                            </span>
                                                        </div>
                                                    )}

                                                </div>
                                            </div>


                                            <div><h3 className="text-xl font-bold text-white mb-3">Your Rating</h3><div className="bg-gray-800 p-4 rounded-lg"><InteractiveStarRating currentRating={userRating} onRate={handleRateShow} disabled={!currentUser} />{!currentUser && <p className="text-xs text-gray-500 mt-2">Log in to rate this show.</p>}</div></div>
                                                                                    </div>
                                    </div>
                                )}
     {activeTab === 'seasons' && (
    !seasonLoaded && isSeasonLoading ? (
        <p className="text-gray-400 p-4">Loading season & episodes...</p>
    ) : (
        <SeasonsTab
 tvShow={tvShow} selectedSeason={selectedSeason} onSeasonChange={setSelectedSeason} seasonDetails={seasonDetails} isLoading={isSeasonLoading} />
                              )  )}
{activeTab === 'cast' && (
    !castLoaded ? (
        <p className="text-gray-400 p-4">Loading cast & crew...</p>
    ) : (
        <div className="space-y-10">

                                        {/* CAST */}
                                        <section>
                                            <h3 className="text-2xl font-bold mb-4 text-white">Top Billed Cast</h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
                                                {cast.map(member => (
                                                    <Link key={member.id} to={`/person/${member.id}`} className="text-center group">
                                                        <div className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2 transition-transform duration-300 group-hover:scale-105">
                                                            <img
                                                                src={
                                                                    member.profile_path
                                                                        ? `https://image.tmdb.org/t/p/w342${member.profile_path}`
                                                                        : "https://placehold.co/342x513/1f2937/FFFFFF?text=N/A"
                                                                }
                                                                alt={member.name}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        </div>

                                                        <p className="text-sm font-bold truncate">{member.name}</p>
                                                        <p className="text-xs text-gray-400 truncate">{member.character}</p>
                                                    </Link>
                                                ))}
                                            </div>
                                        </section>

                                        {/* CREW */}
                                        <CrewSection title="Directors" people={crew.directors} />
                                        <CrewSection title="Writers" people={crew.writers} />
                                        <CrewSection title="Producers" people={crew.producers} />
                                        <CrewSection title="Music By" people={crew.music} />
                                        <CrewSection title="Cinematography" people={crew.cinematography} />
                                        <CrewSection title="Editors" people={crew.editors} />

                                    </div>
    )
                                )}

                                {activeTab === 'reviews' && (
                                     <div>
                                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><MessageSquare className="w-6 h-6 text-[var(--dominant-color)]"/>Community Comments</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-gray-800 p-6 rounded-lg">
                                                <h4 className="text-lg font-semibold mb-4">Leave a Comment</h4>
                                                {currentUser ? (<form onSubmit={handleReviewSubmit}><div className="mb-4"><textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows="4" className="w-full p-2 bg-gray-700 rounded-md focus:ring-2 focus:ring-[var(--dominant-color)] outline-none" placeholder="Share your thoughts..."></textarea></div><button type="submit" disabled={isSubmitting} className="w-full px-5 py-2.5 rounded-full font-semibold bg-[var(--dominant-color)] hover:opacity-90 disabled:bg-gray-600 text-white text-sm transition-opacity">{isSubmitting ? "Submitting..." : "Submit Comment"}</button></form>) : (<p className="text-gray-400">Please <Link to="/login" className="text-[var(--dominant-color)] hover:underline">log in</Link> to leave a comment.</p>)}
                                            </div>
                                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">{reviews.length > 0 ? (reviews.map(review => (<ReviewCard key={review.id} review={review} isAdmin={isAdmin} onDelete={handleDeleteReview} />))) : (<div className="text-center text-gray-500 py-10"><p>No comments yet.</p><p>Be the first to share your thoughts!</p></div>)}</div>
                                        </div>
                                     </div>
                                )}
{activeTab === 'related' && (
    !relatedLoaded ? (
        <p className="text-gray-400 p-4">Loading recommendations...</p>
    ) : (
        <div>

                                       <h3 className="text-2xl font-bold mb-4 text-white">You Might Also Like</h3>
                                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">{related.map(m => <MovieCard key={m.id} id={m.id} title={m.name} isTV={true} imageUrl={m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null} tmdbRating={m.vote_average?.toString()} />)}</div>
                                    </div>
    )
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TVDetail;

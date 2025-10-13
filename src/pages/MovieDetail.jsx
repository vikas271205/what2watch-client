// src/pages/MovieDetail.jsx

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useColor } from "color-thief-react";
import { auth ,db } from "../firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import API_BASE from "../utils/api";
import MovieCard from "../components/MovieCard";
import ShimmerDetail from "../components/ShimmerDetail";
import RatingCircle from "../components/RatingCircle";
import { getWatchmodeId, getStreamingSources } from "../api/watchmode";
import { motion, AnimatePresence } from "framer-motion";
// --- FIX: Import the Bookmark icon for the new UI ---
import { Star, Trash2, Users, Clapperboard, Film, MessageSquare, Sparkles, PlayCircle, Play, Bookmark } from "lucide-react";


const formatRuntime = (mins) => {
    if (!mins || typeof mins !== 'number' || mins <= 0) return null;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    let result = '';
    if (hours > 0) result += `${hours}h`;
    if (remainingMins > 0) result += ` ${remainingMins}m`;
    return result.trim();
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

const ReviewCard = ({ review, isAdmin, onDelete }) => {
    const formattedDate = review.createdAt?.seconds ? new Date(review.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Just now';
    return ( <div className="bg-gray-800 p-4 rounded-lg relative group"> <div className="flex items-start mb-2"> <img src={review.userAvatar || `https://placehold.co/40x40/2d3748/FFFFFF?text=${review.userName.charAt(0)}`} alt={review.userName} className="w-10 h-10 rounded-full mr-3"/> <div className="flex-1"> <div className="flex items-center justify-between"> <p className="font-semibold">{review.userName}</p> <p className="text-xs text-gray-400">{formattedDate}</p> </div> {review.rating && <div className="flex items-center">{[...Array(10)].map((_, i) => (<Star key={i} size={14} className={i < review.rating ? "text-yellow-400 fill-current" : "text-gray-600"}/>))}</div>} </div> </div> <p className="text-gray-300 text-sm leading-relaxed pr-8 whitespace-pre-line">{review.comment}</p> {isAdmin && ( <button onClick={() => onDelete(review.id)} className="absolute top-2 right-2 p-1.5 bg-red-800/50 text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-800 hover:text-white" title="Delete Comment"> <Trash2 size={16} /> </button> )} </div> );
};

const WatchOnSection = ({ sources }) => {
    // FIX: Replaced the logo URLs with brand colors for a cleaner, more reliable UI.
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

    // UI ENHANCEMENT: The entire component is updated for a more modern look.
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

function MovieDetail() {
    const { id } = useParams();
    const [movie, setMovie] = useState(null);
    const [theHook, setTheHook] = useState("");
    const [trailerKey, setTrailerKey] = useState(null);
    const [cast, setCast] = useState([]);
    const [relatedMovies, setRelatedMovies] = useState([]);
    const [streamingSources, setStreamingSources] = useState([]);
    const [omdbRatings, setOmdbRatings] = useState({ imdb: null, rt: null, uncle: null });
    const [userRating, setUserRating] = useState(0);
    const [comment, setComment] = useState("");
    const [reviews, setReviews] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("synopsis");
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUser, setCurrentUser] = useState(auth.currentUser);
    const [isInWatchlist, setIsInWatchlist] = useState(false);

    const posterUrl = movie?.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : null;
    const { data: dominantColor } = useColor(posterUrl, 'hex', { crossOrigin: 'anonymous', quality: 10 });

    useEffect(() => {
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
	    const fetchWatchlistStatus = async () => {
		if (!currentUser || !movie) return; // ensure user and movie exist
		const docId = `${currentUser.uid}_${movie.id}_movie`;
		const docRef = doc(db, "watchlists", docId);
		try {
		    const docSnap = await getDoc(docRef);
		    setIsInWatchlist(docSnap.exists());
		} catch (err) {
		    console.error("Failed to fetch watchlist:", err);
		    setIsInWatchlist(false);
		}
	    };
	    fetchWatchlistStatus();
	}, [currentUser, movie]);
	
	const toggleWatchlist = async () => {
	    if (!currentUser) {
		alert("Please log in to manage your watchlist.");
		return;
	    }

	    const docId = `${currentUser.uid}_${movie.id}_movie`;
	    const docRef = doc(db, "watchlists", docId);

	    try {
		if (isInWatchlist) {
		    await deleteDoc(docRef);
		    setIsInWatchlist(false);
		} else {
		    const data = {
		        userId: currentUser.uid,
		        movieId: `${movie.id}_movie`,
		        title: movie.title,
		        imageUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
		        rating: movie.vote_average || null,
		        createdAt: new Date(),
		    };
		    await setDoc(docRef, data);
		    setIsInWatchlist(true);
		}
	  if (isInWatchlist) {
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            await deleteDoc(docRef);
            setIsInWatchlist(false);
        } else {
            // This case might happen if there's a quick double-click, it's safe to just update state
            setIsInWatchlist(false);
        }
    } catch (err) {
        console.error("Error removing from watchlist:", err);
    }
}

	    } catch (error) {
		console.error("Failed to update watchlist:", error);
		alert("Could not update your watchlist. Please try again.");
	    }
	};

	

    useEffect(() => {
        setMovie(null);
        window.scrollTo(0, 0);

        const fetchAll = async () => {
            try {
                const [movieRes, reviewsRes] = await Promise.all([
                    fetch(`${API_BASE}/api/tmdb/movie/${id}`),
                    fetch(`${API_BASE}/api/movie/${id}/reviews`)
                ]);
                
                const movieData = await movieRes.json();
                setMovie(movieData);

                if (reviewsRes.ok) {
                    const reviewsData = await reviewsRes.json();
                    if (Array.isArray(reviewsData)) { setReviews(reviewsData); }
                }

                const [aiData, omdbData, trailerData, castData, similarData] = await Promise.all([
                    fetch(`${API_BASE}/api/ai/rewrite-overview`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: movieData.title, overview: movieData.overview, tmdbId: movieData.id }) }).then(res => res.json()),
                    fetch(`${API_BASE}/api/omdb?title=${encodeURIComponent(movieData.title)}&year=${movieData.release_date?.slice(0, 4)}`).then(res => res.json()),
                    fetch(`${API_BASE}/api/tmdb/movie/${id}/videos`).then(res => res.json()),
                    fetch(`${API_BASE}/api/tmdb/movie/${id}/credits`).then(res => res.json()),
                    fetch(`${API_BASE}/api/tmdb/movie/${id}/similar`).then(res => res.json()),
                ]);

                if (aiData.rewritten) setTheHook(aiData.rewritten.trim());
                if (omdbData && !omdbData.error && omdbData.Ratings) {
                    const imdbRating = omdbData.Ratings.find(r => r.Source === "Internet Movie Database")?.Value.split('/')[0] || null;
                    const rtRating = omdbData.Ratings.find(r => r.Source === "Rotten Tomatoes")?.Value || null;
                    let uncleScore = movieData.vote_average ? parseFloat(movieData.vote_average.toFixed(1)) : null;
                    if (uncleScore && imdbRating) { uncleScore = ((uncleScore + parseFloat(imdbRating)) / 2).toFixed(1); }
                    setOmdbRatings({ imdb: imdbRating, rt: rtRating, uncle: uncleScore });
                }
                const trailer = trailerData.results?.find(v => v.type === "Trailer" && v.site === "YouTube");
                setTrailerKey(trailer?.key || null);
                setCast(castData.cast?.slice(0, 18) || []);
                setRelatedMovies(similarData.results?.slice(0, 12) || []);

                const releaseYear = movieData.release_date?.slice(0, 4);
                const wmId = await getWatchmodeId(movieData.title, releaseYear, "movie");
                if (wmId) {
                    const sources = await getStreamingSources(wmId);
                    const filtered = (sources || []).filter(src => src.type === "sub" || src.type === "free");
                    if (filtered.length > 0) {
                        setStreamingSources(filtered);
                    } else {
                        setStreamingSources([{ name: "Not available for streaming in your region", type: "note", web_url: null }]);
                    }
                } else {
                    setStreamingSources([]);
                }

            } catch (err) { console.error("Failed to fetch movie details:", err); }
        };
        fetchAll();
    }, [id]);
    
    useEffect(() => {
        const fetchUserRating = async () => {
            if (currentUser && id) {
                try {
                    const idToken = await currentUser.getIdToken(true);
                    const response = await fetch(`${API_BASE}/api/movie/${id}/my-rating`, { headers: { 'Authorization': `Bearer ${idToken}` } });
                    if (response.ok) {
                        const data = await response.json();
                        setUserRating(data.rating || 0);
                    }
                } catch (error) { console.error("Could not fetch user rating:", error); }
            } else {
                setUserRating(0);
            }
        };
        fetchUserRating();
    }, [currentUser, id]);

    const handleRateMovie = async (rating) => { if (!currentUser) { alert("Please log in to rate movies."); return; } setUserRating(rating); try { const idToken = await currentUser.getIdToken(true); await fetch(`${API_BASE}/api/movie/${id}/rate`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}`}, body: JSON.stringify({ rating }), }); } catch (error) { console.error("Rating submission error:", error); alert("Could not save your rating."); setUserRating(0); } };
    const handleReviewSubmit = async (e) => { e.preventDefault(); if (!currentUser) { alert("Please log in to post a comment."); return; } if (comment.trim() === "") { alert("Comment cannot be empty."); return; } setIsSubmitting(true); try { const idToken = await currentUser.getIdToken(true); const response = await fetch(`${API_BASE}/api/movie/${id}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` }, body: JSON.stringify({ comment }), }); if (!response.ok) throw new Error((await response.json()).error || "Failed to submit comment."); const newReview = await response.json(); setReviews(prevReviews => [newReview, ...prevReviews]); setComment(''); } catch (error) { console.error("Comment submission error:", error); alert(`Error: ${error.message}`); } finally { setIsSubmitting(false); } };
const handleDeleteReview = async (reviewId) => {
    if (!currentUser) {
        alert("You must be logged in to delete.");
        return;
    }
    if (!window.confirm("Are you sure you want to delete this comment?")) {
        return;
    }

    console.log(`[DEBUG] Attempting to delete review with ID: ${reviewId}`);

    try {
        const idToken = await currentUser.getIdToken(true);
        const url = `${API_BASE}/api/review/${reviewId}`;
        
        console.log(`[DEBUG] Sending DELETE request to: ${url}`);

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${idToken}`,
            },
        });

        console.log('[DEBUG] Response received from server:', response);
        console.log(`[DEBUG] Response status: ${response.status} (${response.statusText})`);
        console.log(`[DEBUG] Response ok: ${response.ok}`);

        if (!response.ok) {
            // Let's find out what the server actually sent back. It might not be JSON.
            const errorText = await response.text();
            console.error('[DEBUG] Server returned an error response body:', errorText);
            throw new Error(errorText || "Failed to delete review.");
        }

        console.log('[DEBUG] Deletion successful. Updating UI.');
        setReviews(prevReviews => prevReviews.filter(review => review.id !== reviewId));

    } catch (error) {
        // Now this catch block WILL trigger if anything goes wrong.
        console.error("Delete error:", error);
        alert(`Error: ${error.message}`);
    }
};

    if (!movie) return <ShimmerDetail />;

    const rtScore = omdbRatings.rt ? parseInt(omdbRatings.rt.replace('%', '')) : null;

    return (
        <div className="bg-gray-900 text-gray-100" style={{ '--dominant-color': dominantColor || '#4f46e5' }}>
            <div className="relative">
                <div className="absolute inset-0 h-[55vh] overflow-hidden">
                    <div className="w-full h-full bg-cover bg-top bg-no-repeat" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})` }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row gap-8 pt-[25vh]">
                        <motion.div className="w-40 md:w-52 flex-shrink-0" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
                            <img src={posterUrl ? posterUrl.replace('w200', 'w500') : "https://placehold.co/500x750/1f2937/FFFFFF?text=No+Image"} alt={movie.title} className="w-full h-auto rounded-xl shadow-2xl shadow-black/60" />
                        </motion.div>
                        <div className="flex flex-col justify-end flex-1 pb-4">
                            <motion.h1 className="text-4xl md:text-6xl font-black tracking-tighter" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}>{movie.title}</motion.h1>
                            <motion.div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}>
                                <span>{movie.release_date?.slice(0, 4)}</span>
                                {movie.runtime > 0 && <span>• {formatRuntime(movie.runtime)}</span>}
                                <div className="flex flex-wrap gap-2">{movie.genres?.slice(0, 3).map(g => (<Link to={`/genres?genre=${g.name}`} key={g.id} className="text-xs font-semibold bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 hover:bg-white/20 transition-colors">{g.name}</Link>))}</div>
                                {/* --- FIX: Replaced the old button with a new, better styled one --- */}
                                <button
                                    onClick={toggleWatchlist}
                                    disabled={!currentUser}
                                    className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full transition-all duration-300 ease-in-out backdrop-blur-sm ${
                                        isInWatchlist 
                                        ? 'bg-[var(--dominant-color)] text-white' 
                                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <Bookmark size={16} className={isInWatchlist ? 'fill-current' : ''} />
                                    {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
                                </button>
                            </motion.div>
                        </div>
                    </div>

                    <div className="py-8">
                        {streamingSources.length > 0 && <WatchOnSection sources={streamingSources} />}
                        <div className="border-b border-gray-700 mb-6">
                            <nav className="flex space-x-2 sm:space-x-4">
                                <TabButton active={activeTab === 'synopsis'} onClick={() => setActiveTab('synopsis')}>Details</TabButton>
                                <TabButton active={activeTab === 'cast'} onClick={() => setActiveTab('cast')}>Cast & Crew</TabButton>
                                <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}>Comments</TabButton>
                                <TabButton active={activeTab === 'related'} onClick={() => setActiveTab('related')}>Related</TabButton>
                            </nav>
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.div key={activeTab} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.2 }}>
                                {activeTab === 'synopsis' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="md:col-span-2">
                                            <h3 className="text-2xl font-bold mb-4">Synopsis</h3>
                                            {theHook && (<div className="mb-6 p-4 rounded-lg bg-gray-800 border-l-4 border-[var(--dominant-color)]"><p className="text-gray-300 italic">"{theHook}"</p></div>)}
                                            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{movie.overview}</p>
                                            {trailerKey && (<div className="mt-8"> <h3 className="text-2xl font-bold mb-4 text-white"><Film className="inline w-6 h-6 mr-2"/>Trailer</h3> <div className="aspect-video"><iframe src={`https://www.youtube.com/embed/${trailerKey}`} title="Trailer" className="w-full h-full rounded-lg" allowFullScreen/></div> </div>)}
                                        </div>
                                        <div className="space-y-6">
                                            <div><h3 className="text-xl font-bold text-white mb-3">Your Rating</h3><div className="bg-gray-800 p-4 rounded-lg"><InteractiveStarRating currentRating={userRating} onRate={handleRateMovie} disabled={!currentUser} />{!currentUser && <p className="text-xs text-gray-500 mt-2">Log in to rate this movie.</p>}</div></div>
                                            <div><h3 className="text-xl font-bold text-white mb-3">Community Ratings</h3><div className="grid grid-cols-2 gap-4 bg-gray-800 p-4 rounded-lg">{omdbRatings.uncle && <RatingCircle score={omdbRatings.uncle} label="Uncle Score" color={dominantColor} />}{movie.vote_average > 0 && <RatingCircle score={movie.vote_average.toFixed(1)} label="TMDB" color="#eab308" />}{omdbRatings.imdb && <RatingCircle score={omdbRatings.imdb} label="IMDb" color="#f5c518" />}{rtScore && <RatingCircle score={rtScore} maxValue={100} label="Rotten Tomatoes" color="#ef4444" />}</div></div>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'cast' && (
                                     <div>
                                        <h3 className="text-2xl font-bold mb-4 text-white">Top Billed Cast</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">{cast.map(member => (<Link key={member.id} to={`/person/${member.id}`} className="text-center group"><div className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2 transition-transform duration-300 group-hover:scale-105"><img src={member.profile_path ? `https://image.tmdb.org/t/p/w342${member.profile_path}` : "https://placehold.co/342x513/1f2937/FFFFFF?text=N/A"} alt={member.name} className="w-full h-full object-cover" loading="lazy" /></div><p className="text-sm font-bold truncate">{member.name}</p><p className="text-xs text-gray-400 truncate">{member.character}</p></Link>))}</div>
                                    </div>
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
                                   <div>
                                       <h3 className="text-2xl font-bold mb-4 text-white">You Might Also Like</h3>
                                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">{relatedMovies.map(m => <MovieCard key={m.id} id={m.id} title={m.title} imageUrl={m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null} tmdbRating={m.vote_average?.toString()} />)}</div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MovieDetail;

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
import { fetchOMDbData } from "../api/omdb";
import { db } from "../firebase";
import { auth } from "../firebase";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

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
  const [omdbData, setOmdbData] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchAll = async () => {
      const res = await fetch(`${API_BASE}/api/tmdb/movie/${id}`);
      const movieData = await res.json();
      setMovie(movieData);

      const releaseYear = movieData.release_date?.slice(0, 4);
      const streamingRes = await fetch(`${API_BASE}/api/watchmode/id?title=${encodeURIComponent(movieData.title)}&year=${releaseYear}`);
      const { id: watchmodeId } = await streamingRes.json();

      if (watchmodeId) {
        const sourcesRes = await fetch(`${API_BASE}/api/watchmode/sources/${watchmodeId}`);
        const sources = await sourcesRes.json();
        setPlatforms(sources);
      }

      const omdb = await fetchOMDbData(movieData.title);
      setOmdbData(omdb);

      const trailerRes = await fetch(`${API_BASE}/api/tmdb/movie/${id}/videos`);
      const trailerData = await trailerRes.json();
      const trailer = trailerData.results.find((v) => v.type === "Trailer" && v.site === "YouTube");
      if (trailer) setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}`);

      const castRes = await fetch(`${API_BASE}/api/tmdb/movie/${id}/credits`);
      const castData = await castRes.json();
      setCast(castData.cast.slice(0, 8));

      const similarRes = await fetch(`${API_BASE}/api/tmdb/movie/${id}/similar`);
      const similarData = await similarRes.json();
      setRelatedMovies(similarData.results.slice(0, 10));

      if (user) {
        const watchRef = doc(db, "watchlists", `${user.uid}_${id}`);
        const watchSnap = await getDoc(watchRef);
        setIsSaved(watchSnap.exists());

        const rateRef = doc(db, "ratings", `${user.uid}_${id}`);
        const rateSnap = await getDoc(rateRef);
        if (rateSnap.exists()) setUserRating(rateSnap.data().rating);
      }

      const q = query(collection(db, "comments"), where("movieId", "==", id));
      const snapshot = await getDocs(q);
      const commentData = snapshot.docs.map(doc => doc.data()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setAllComments(commentData);
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
        rating: movie.vote_average?.toFixed(1),
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
    const data = snapshot.docs.map(doc => doc.data()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setAllComments(data);
  };

  if (!movie) return <p className="p-6 text-white">Loading...</p>;

  return <div className="relative min-h-screen text-white bg-black">[...]</div>; // UI remains unchanged
}

export default MovieDetail;

// src/pages/Watchlist.jsx

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import MovieCard from "../components/MovieCard";
import { useLoading } from "../context/LoadingContext";
import { motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth"; // <-- Import the listener

function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const { setIsLoading } = useLoading();
  
  // FIX 1: Use component state to manage the user, don't use the static auth.currentUser
  const [user, setUser] = useState(auth.currentUser);

  // FIX 2: Add an effect to listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);


  // FIX 3: This effect will now correctly run whenever the `user` state changes from null to a user object
  useEffect(() => {
    const fetchWatchlist = async () => {
      // The check is now against the reliable state variable
      if (!user) {
        setWatchlist([]);
        setIsLoading(false); // Make sure to turn off loading if the user is logged out
        return;
      }

      try {
        setIsLoading(true);
        const q = query(collection(db, "watchlists"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.data().movieId || doc.data().mediaId?.replace("_movie", "").replace("_tv", ""), // More robust ID parsing
          docId: doc.id, // Keep the full doc ID for deletion
          title: doc.data().title,
          imageUrl: doc.data().imageUrl,
          rating: doc.data().rating,
          isTV: doc.data().mediaType === 'tv',
        }));
        setWatchlist(data);
      } catch (e) {
        console.error("Failed to fetch watchlist", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWatchlist();
  }, [user, setIsLoading]); // This dependency array is now correct

  const removeFromWatchlist = async (docId, id, isTV) => {
    if (!user) return;
    try {
      // Use the full document ID for reliable deletion
      await deleteDoc(doc(db, "watchlists", docId));
      setWatchlist((prev) => prev.filter((item) => item.docId !== docId));
    } catch (e) {
      console.error("Failed to remove from watchlist", e);
    }
  };

return (
  <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:via-black dark:to-gray-800 text-black dark:text-white px-4 sm:px-6 py-6">
    <motion.h1
      className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 py-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      📋 Your Watchlist
    </motion.h1>

    {!user && (
      <motion.p
        className="text-gray-600 dark:text-gray-400 text-sm sm:text-base"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Please log in to view your watchlist.
      </motion.p>
    )}

    {user && watchlist.length === 0 && (
      <motion.p
        className="text-gray-600 dark:text-gray-400 text-sm sm:text-base"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Your watchlist is empty. Add some movies or shows!
      </motion.p>
    )}

    {user && watchlist.length > 0 && (
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {watchlist.map((item) => (
          <div key={item.docId} className="relative group">
            <MovieCard
              id={item.id}
              title={item.title}
              imageUrl={item.imageUrl}
              tmdbRating={item.rating}
              isTV={item.isTV}
              genres={[]}
              language={null}
            />
            <motion.button
              onClick={() => removeFromWatchlist(item.docId, item.id, item.isTV)}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-sm sm:text-base shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={`Remove ${item.title} from watchlist`}
            >
              ✕
            </motion.button>
          </div>
        ))}
      </motion.div>
    )}
  </div>
);

}

export default Watchlist;

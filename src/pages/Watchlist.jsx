import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import MovieCard from "../components/MovieCard";
import { useLoading } from "../context/LoadingContext";
import { motion } from "framer-motion";

function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const { setIsLoading } = useLoading();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user) {
        setWatchlist([]);
        return;
      }

      try {
        setIsLoading(true);
        const q = query(collection(db, "watchlists"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.data().movieId || doc.data().tvId?.replace("_tv", ""),
          title: doc.data().title,
          imageUrl: doc.data().imageUrl,
          rating: doc.data().rating,
          isTV: !!doc.data().tvId,
        }));
        setWatchlist(data);
      } catch (e) {
        console.error("Failed to fetch watchlist", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWatchlist();
  }, [user, setIsLoading]);

  const removeFromWatchlist = async (id, isTV) => {
    try {
      const docId = isTV ? `${user.uid}_${id}_tv` : `${user.uid}_${id}`;
      await deleteDoc(doc(db, "watchlists", docId));
      setWatchlist((prev) => prev.filter((item) => item.id !== id || item.isTV !== isTV));
    } catch (e) {
      console.error("Failed to remove from watchlist", e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white px-4 sm:px-6 py-6">
      <motion.h1
        className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 sticky top-0 bg-gray-900/80 backdrop-blur-sm z-10 py-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        📋 Your Watchlist
      </motion.h1>

      {!user && (
        <motion.p
          className="text-gray-400 text-sm sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Please log in to view your watchlist.
        </motion.p>
      )}

      {user && watchlist.length === 0 && (
        <motion.p
          className="text-gray-400 text-sm sm:text-base"
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
            <div key={`${item.id}_${item.isTV}`} className="relative">
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
                onClick={() => removeFromWatchlist(item.id, item.isTV)}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-sm sm:text-base"
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
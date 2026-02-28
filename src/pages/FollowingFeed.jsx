import { useEffect, useState, useContext } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

const FollowingFeed = () => {
  const { user } = useContext(AuthContext);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Step 1: Get following users
      const followingSnap = await getDocs(
        collection(db, "users", user.uid, "following")
      );

      const followingIds = followingSnap.docs.map(doc => doc.id);

      if (followingIds.length === 0) {
        setLoading(false);
        return;
      }

      // Firestore supports max 10 in-query values
      const limitedIds = followingIds.slice(0, 10);

      // Step 2: Fetch their public lists
      const listsQuery = query(
        collection(db, "lists"),
        where("ownerId", "in", limitedIds),
        where("isPublic", "==", true),
        orderBy("trendingScore", "desc")
      );

      const listsSnap = await getDocs(listsQuery);

      setLists(listsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };

    fetchFeed();
  }, [user]);

  if (loading) return <div className="p-6 text-white">Loading...</div>;

  if (!user)
    return <div className="p-6 text-white">Login to see your feed.</div>;

  if (lists.length === 0)
    return <div className="p-6 text-white">No lists from followed users yet.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 text-white">
      <h1 className="text-3xl font-bold mb-8">Following Feed</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {lists.map((list) => (
          <Link
            key={list.id}
            to={`/list/${list.id}`}
            className="relative group"
          >
            <img
              src={list.coverImage}
              alt={list.title}
              className="w-full rounded"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-end p-3 text-white text-sm font-bold transition">
              {list.title}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FollowingFeed;
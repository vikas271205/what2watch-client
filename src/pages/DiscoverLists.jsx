import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

const DiscoverLists = () => {
  const [trending, setTrending] = useState([]);
  const [latest, setLatest] = useState([]);

  useEffect(() => {
    const fetchLists = async () => {
      const trendingQuery = query(
        collection(db, "lists"),
        where("isPublic", "==", true),
        orderBy("likesCount", "desc"),
        limit(12)
      );

      const latestQuery = query(
        collection(db, "lists"),
        where("isPublic", "==", true),
        orderBy("createdAt", "desc"),
        limit(12)
      );

      const [trendingSnap, latestSnap] = await Promise.all([
        getDocs(trendingQuery),
        getDocs(latestQuery),
      ]);

      setTrending(trendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLatest(latestSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchLists();
  }, []);

  const renderGrid = (lists) => (
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
  );

  return (
    <div className="max-w-6xl mx-auto p-6 text-white">
      <h1 className="text-3xl font-bold mb-8">Discover Lists</h1>

      <h2 className="text-xl font-semibold mb-4">🔥 Trending</h2>
      {renderGrid(trending)}

      <h2 className="text-xl font-semibold mt-12 mb-4">🆕 Latest</h2>
      {renderGrid(latest)}
    </div>
  );
};

export default DiscoverLists;
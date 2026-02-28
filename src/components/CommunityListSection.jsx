import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

const CommunityListsSection = () => {
  const [lists, setLists] = useState([]);

  useEffect(() => {
    const fetchLists = async () => {
      const q = query(
        collection(db, "lists"),
        where("isPublic", "==", true),
        orderBy("lastActivityAt", "desc"),
        limit(8)
      );

      const snap = await getDocs(q);
      setLists(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchLists();
  }, []);

  if (lists.length === 0) return null;

  return (
    <div className="px-6 mt-16">
      <h2 className="text-2xl font-bold text-white mb-6">
        🌍 Community Lists
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
        {lists.map((list) => (
          <Link
            key={list.id}
            to={`/list/${list.id}`}
            className="relative group"
          >
            <img
              src={list.coverImage}
              alt={list.title}
              className="w-full aspect-[2/3] object-cover rounded-xl"
            />

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col justify-end p-4 text-white transition">
              <div className="font-bold text-sm">{list.title}</div>
              <div className="text-xs text-gray-300 mt-1">
                ❤️ {list.likesCount} · {list.itemsCount} items
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CommunityListsSection;
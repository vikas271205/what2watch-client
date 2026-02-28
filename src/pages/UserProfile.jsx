import { useEffect, useState,useContext } from "react";
import { useParams, Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import { toggleFollowUser } from "../utils/listService";
const UserProfile = () => {
  const { userId } = useParams();
  const { user } = useContext(AuthContext);
const [isFollowing, setIsFollowing] = useState(false);
  const [lists, setLists] = useState([]);
  const [likedLists, setLikedLists] = useState([]);
  const [savedLists, setSavedLists] = useState([]);
  const [loading, setLoading] = useState(true);
const [followersCount, setFollowersCount] = useState(0);
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

      // Public lists created by user
      const createdQuery = query(
        collection(db, "lists"),
        where("ownerId", "==", userId),
        where("isPublic", "==", true),
        orderBy("createdAt", "desc")
      );

      const createdSnap = await getDocs(createdQuery);
      setLists(createdSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Lists liked by user
if (user && user.uid === userId) {
  const likedSnap = await getDocs(
    collection(db, "users", userId, "likedLists")
  );

  // Fetch saved lists (only for own profile)
if (user && user.uid === userId) {
  const savedSnap = await getDocs(
    collection(db, "users", userId, "savedLists")
  );

  const savedIds = savedSnap.docs.map(doc => doc.id);

  if (savedIds.length > 0) {
    const savedData = [];

    for (const id of savedIds) {
      const listDoc = await getDoc(doc(db, "lists", id));
      if (listDoc.exists()) {
        savedData.push({ id: listDoc.id, ...listDoc.data() });
      }
    }

    setSavedLists(savedData);
  }
}

  const likedIds = likedSnap.docs.map(doc => doc.id);

  if (likedIds.length > 0) {
    const likedData = [];

    for (const id of likedIds) {
      const listDoc = await getDoc(doc(db, "lists", id));
      if (listDoc.exists()) {
        likedData.push({ id: listDoc.id, ...listDoc.data() });
      }
    }

    setLikedLists(likedData);
  }
}
      if (user) {
  const followRef = doc(db, "users", userId, "followers", user.uid);
  const snap = await getDoc(followRef);
  setIsFollowing(snap.exists());
}
      setLoading(false);
  const followersSnap = await getDocs(
  collection(db, "users", userId, "followers")
);

setFollowersCount(followersSnap.size);
    };

    fetchProfile();
  }, [userId,user]);

  const renderGrid = (data) => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {data.map((list) => (
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

  if (loading) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 text-white">
      <h1 className="text-3xl font-bold mb-10">{lists[0]?.ownerUsername || "User"}</h1>
      <div className="text-gray-400 mt-2">
  {followersCount} followers
</div>
      {user && user.uid !== userId && (
  <button
    onClick={async () => {
      await toggleFollowUser({
        currentUser: user,
        targetUserId: userId,
      });

      setIsFollowing((prev) => !prev);
    }}
    className={`mt-4 px-4 py-2 rounded ${
      isFollowing ? "bg-gray-600" : "bg-blue-600"
    }`}
  >
    {isFollowing ? "Following" : "Follow"}
  </button>
)}
      <h2 className="text-xl font-semibold mb-4">📚 Public Lists</h2>
      {lists.length ? renderGrid(lists) : <p>No public lists</p>}

{user && user.uid === userId && (
  <>
    <h2 className="text-xl font-semibold mt-12 mb-4">❤️ Liked Lists</h2>
    {likedLists.length ? renderGrid(likedLists) : <p>No liked lists</p>}
  </>

)}
{user && user.uid === userId && (
  <>
    <h2 className="text-xl font-semibold mt-12 mb-4">💾 Saved Lists</h2>
    {savedLists.length ? renderGrid(savedLists) : <p>No saved lists</p>}
  </>
)}
    </div>
  );
};

export default UserProfile;
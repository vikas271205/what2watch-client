import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import {
  removeItemFromList,
  toggleLikeList,
  toggleSaveList,
  addCommentToList,
  deleteCommentFromList,
} from "../utils/listService";
import { Heart, Bookmark, Share2 } from "lucide-react";

const ListDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

// ===== LOCAL PAGE THEMES =====
const themes = {
light: {
  primary: "168,85,247",
  secondary: "6,182,212",
  base: "245,243,255",
},
dark: {
  primary: "124,58,237",
  secondary: "236,72,153",
  base: "15,12,25",
},
};

// ================= DARK MODE SYNC FIX =================

const [isDark, setIsDark] = useState(() =>
  document.documentElement.classList.contains("dark")
);

useEffect(() => {
  const observer = new MutationObserver(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return () => observer.disconnect();
}, []);

const theme = isDark ? themes.dark : themes.light;

// ======================================================
  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);

      const listRef = doc(db, "lists", id);
      const listSnap = await getDoc(listRef);

      if (!listSnap.exists()) {
        setList(null);
        setLoading(false);
        return;
      }

      setList({ id: listSnap.id, ...listSnap.data() });

      const itemsQuery = query(
        collection(db, "lists", id, "items"),
        orderBy("position"),
        limit(PAGE_SIZE)
      );

      if (user) {
        const likeRef = doc(db, "users", user.uid, "likedLists", id);
        const likeSnap = await getDoc(likeRef);
        setIsLiked(likeSnap.exists());

        const saveRef = doc(db, "users", user.uid, "savedLists", id);
        const saveSnap = await getDoc(saveRef);
        setIsSaved(saveSnap.exists());
      }

      const itemsSnap = await getDocs(itemsQuery);
      setItems(itemsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLastDoc(itemsSnap.docs[itemsSnap.docs.length - 1] || null);

      if (itemsSnap.docs.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setLoading(false);
    };

    fetchList();
  }, [id, user]);

  useEffect(() => {
    const commentsQuery = query(
      collection(db, "lists", id, "comments"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      setComments(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return () => unsubscribe();
  }, [id]);

  const loadMore = async () => {
    if (!lastDoc) return;

    const nextQuery = query(
      collection(db, "lists", id, "items"),
      orderBy("position"),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );

    const nextSnap = await getDocs(nextQuery);
    const newItems = nextSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setItems((prev) => [...prev, ...newItems]);
    setLastDoc(nextSnap.docs[nextSnap.docs.length - 1] || null);

    if (nextSnap.docs.length < PAGE_SIZE) {
      setHasMore(false);
    }
  };

  const handleRemove = async (item) => {
    await removeItemFromList({
      listId: id,
      tmdbId: item.tmdbId,
      mediaType: item.mediaType,
      user,
    });

    setItems((prev) => prev.filter((i) => i.id !== item.id));

    setList((prev) => ({
      ...prev,
      itemsCount: prev.itemsCount - 1,
    }));
  };

  const Skeleton = () => {
    const skeletonColor = `rgba(${theme.primary},0.15)`;

    return (
      <div className="animate-pulse">
        {/* Header Skeleton */}
        <div className="max-w-6xl mx-auto px-6 pt-16">
          <div className="rounded-2xl p-10 backdrop-blur-xl border">
            <div className="flex flex-col md:flex-row gap-10">
              <div
                className="w-64 h-96 rounded-xl"
                style={{ backgroundColor: skeletonColor }}
              />
              <div className="flex-1 space-y-4">
                <div
                  className="h-8 w-2/3 rounded"
                  style={{ backgroundColor: skeletonColor }}
                />
                <div
                  className="h-4 w-1/4 rounded"
                  style={{ backgroundColor: skeletonColor }}
                />
                <div
                  className="h-4 w-3/4 rounded"
                  style={{ backgroundColor: skeletonColor }}
                />
                <div
                  className="h-10 w-40 rounded-full"
                  style={{ backgroundColor: skeletonColor }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="max-w-6xl mx-auto px-6 mt-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] rounded-xl"
              style={{ backgroundColor: skeletonColor }}
            />
          ))}
        </div>

        {/* Comments Skeleton */}
        <div className="max-w-4xl mx-auto mt-20 px-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl"
              style={{ backgroundColor: skeletonColor }}
            />
          ))}
        </div>
      </div>
    );
  };

  if (loading)
    return <Skeleton/>;
  if (!list)
    return <div className="p-10 text-center">List not found</div>;

  return (
    <div
      className="relative min-h-screen pb-24 transition-colors duration-500"
style={{
  background: `
    radial-gradient(circle at 20% 30%, rgba(${theme.primary},0.35), transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(${theme.secondary},0.30), transparent 50%),
    rgb(${theme.base})
  `,
}}
    >
      {/* HEADER */}
      <div className="max-w-6xl mx-auto px-6 pt-16">
        <div
          className="rounded-2xl p-10 shadow-xl backdrop-blur-xl border"
          style={{
            backgroundColor: `rgba(${theme.primary},0.06)`,
            borderColor: `rgba(${theme.primary},0.15)`,
          }}
        >
          <div className="flex flex-col md:flex-row gap-10">
            <div className="w-64 h-96 rounded-xl overflow-hidden shadow-lg shrink-0">
              {items[0] && (
                <img
                  src={items[0].posterPath}
                  alt="cover"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3">{list.title}</h1>

              <Link
                to={`/user/${list.ownerId}`}
                className="text-sm font-medium"
                style={{ color: `rgba(${theme.primary},1)` }}
              >
                {list.ownerUsername}
              </Link>

              <p className="mt-4 mb-6 opacity-80">{list.description}</p>

              <div className="flex gap-6 text-sm opacity-70 mb-6">
                <span>{list.itemsCount} items</span>
                <span>{list.likesCount} likes</span>
                <span>{list.savesCount} saves</span>
              </div>

              <div className="flex gap-4">
                <button
                  disabled={likeLoading}
                  onClick={async () => {
                    if (!user) return alert("Login required");
                    setLikeLoading(true);
                    const wasLiked = isLiked;
                    await toggleLikeList({ listId: id, user });
                    setIsLiked(!wasLiked);
                    setList((prev) => ({
                      ...prev,
                      likesCount: prev.likesCount + (wasLiked ? -1 : 1),
                    }));
                    setLikeLoading(false);
                  }}
                  className="flex items-center gap-2 px-5 py-2 rounded-full transition"
                  style={{
                    backgroundColor: isLiked
                      ? `rgba(239,68,68,1)`
                      : `rgba(${theme.primary},0.12)`,
                  }}
                >
                  <Heart size={16} />
                  {list.likesCount}
                </button>

                <button
                  disabled={saveLoading}
                  onClick={async () => {
                    if (!user) return alert("Login required");
                    setSaveLoading(true);
                    const wasSaved = isSaved;
                    await toggleSaveList({ listId: id, user });
                    setIsSaved(!wasSaved);
                    setList((prev) => ({
                      ...prev,
                      savesCount: prev.savesCount + (wasSaved ? -1 : 1),
                    }));
                    setSaveLoading(false);
                  }}
                  className="flex items-center gap-2 px-5 py-2 rounded-full transition"
                  style={{
                    backgroundColor: isSaved
                      ? `rgba(234,179,8,1)`
                      : `rgba(${theme.primary},0.12)`,
                  }}
                >
                  <Bookmark size={16} />
                  {list.savesCount}
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied!");
                  }}
                  className="flex items-center gap-2 px-5 py-2 rounded-full transition"
                  style={{
                    backgroundColor: `rgba(${theme.primary},0.12)`,
                  }}
                >
                  <Share2 size={16} />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="max-w-6xl mx-auto px-6 mt-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="relative group rounded-xl overflow-hidden hover:scale-[1.03] transition"
              style={{
                backgroundColor: `rgba(${theme.primary},0.05)`,
              }}
            >
              <Link to={`/${item.mediaType}/${item.tmdbId}`}>
                <img
                  src={item.posterPath}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </Link>

              <div className="absolute top-2 left-2 text-xs bg-black/70 px-2 py-1 rounded-full text-white">
                #{index + 1}
              </div>

              {user && user.uid === list.ownerId && (
                <button
                  onClick={() => handleRemove(item)}
                  className="absolute top-2 right-2 bg-red-600 text-xs px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition text-white"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="text-center mt-12">
            <button
              onClick={loadMore}
              className="px-8 py-3 rounded-full transition"
              style={{
                backgroundColor: `rgba(${theme.primary},0.15)`,
              }}
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* COMMENTS */}
      <div className="max-w-4xl mx-auto mt-20 px-6">
        <h2 className="text-2xl font-bold mb-6">Discussion</h2>

        {user && (
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 rounded-full"
              style={{
                backgroundColor: `rgba(${theme.primary},0.08)`,
              }}
            />
            <button
              disabled={commentLoading}
              onClick={async () => {
                setCommentLoading(true);
                await addCommentToList({ listId: id, text: commentText, user });
                setCommentText("");
                setCommentLoading(false);
              }}
              className="px-6 py-2 rounded-full text-white"
              style={{
                backgroundColor: `rgba(${theme.primary},0.8)`,
              }}
            >
              Post
            </button>
          </div>
        )}

        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-xl"
              style={{
                backgroundColor: `rgba(${theme.primary},0.05)`,
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <span
                  className="text-sm font-semibold"
                  style={{ color: `rgba(${theme.primary},1)` }}
                >
                  {comment.username}
                </span>

                {(user &&
                  (user.uid === comment.userId ||
                    user.uid === list.ownerId)) && (
                  <button
                    onClick={() =>
                      deleteCommentFromList({
                        listId: id,
                        commentId: comment.id,
                        user,
                      })
                    }
                    className="text-xs text-red-500"
                  >
                    Delete
                  </button>
                )}
              </div>

              <p className="text-sm opacity-80">{comment.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ListDetail;
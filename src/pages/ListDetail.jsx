import { useEffect, useState, useContext } from "react";
import { useParams,Link } from "react-router-dom";
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
import { removeItemFromList } from "../utils/listService";
import { toggleLikeList, toggleSaveList ,addCommentToList, deleteCommentFromList} from "../utils/listService";

const ListDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

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
}
const itemsSnap = await getDocs(itemsQuery);

setItems(itemsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

setLastDoc(itemsSnap.docs[itemsSnap.docs.length - 1] || null);

if (itemsSnap.docs.length < PAGE_SIZE) {
  setHasMore(false);
}
if (user) {
  const saveRef = doc(db, "users", user.uid, "savedLists", id);
  const saveSnap = await getDoc(saveRef);
  setIsSaved(saveSnap.exists());
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
      snapshot.docs.map(doc => ({
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
    try {
      await removeItemFromList({
        listId: id,
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
        user,
      });

      setItems((prev) =>
  prev.filter((i) => i.id !== item.id)
);

setList((prev) => ({
  ...prev,
  itemsCount: prev.itemsCount - 1,
}));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!list) return <div className="p-6">List not found</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 text-white">
<div className="relative mb-8">
  {list.coverImage && (
    <div className="absolute inset-0 h-64 overflow-hidden rounded-xl">
      <img
        src={list.coverImage}
        alt="cover"
        className="w-full h-full object-cover blur-sm scale-110"
      />
      <div className="absolute inset-0 bg-black/70" />
    </div>
  )}

  <div className="relative p-6">
<h1 className="text-3xl font-bold">{list.title}</h1>

<div className="text-sm text-gray-400 mt-1">
  Created by{" "}
  <Link
    to={`/user/${list.ownerId}`}
    className="text-blue-400 hover:underline"
  >
    {list.ownerUsername}
  </Link>
</div>

<p className="text-gray-400 mt-2">{list.description}</p>
    <div className="text-sm text-gray-500 mt-2">
      {list.itemsCount} items
    </div>
    <button
  disabled={likeLoading}
onClick={async () => {
  if (!user) {
    alert("Login required");
    return;
  }

  try {
    setLikeLoading(true);

    const wasLiked = isLiked;

    await toggleLikeList({ listId: id, user });

    setIsLiked(!wasLiked);

    setList((prev) => ({
      ...prev,
      likesCount: prev.likesCount + (wasLiked ? -1 : 1),
    }));

  } catch (err) {
    alert(err.message);
  } finally {
    setLikeLoading(false);
  }
}}
  className={`mt-3 px-4 py-2 rounded ${
    isLiked ? "bg-red-600" : "bg-gray-700"
  } text-white`}
>
  {isLiked ? "❤️ Liked" : "🤍 Like"} ({list.likesCount})
</button>

<button
  onClick={() => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied!");
  }}
  className="ml-4 bg-gray-600 px-4 py-2 rounded text-white"
>
  🔗 Share
</button>
<button
  disabled={saveLoading}
  onClick={async () => {
    if (!user) {
      alert("Login required");
      return;
    }

    try {
      setSaveLoading(true);

      const wasSaved = isSaved;

      await toggleSaveList({ listId: id, user });

      setIsSaved(!wasSaved);

      setList((prev) => ({
        ...prev,
        savesCount: prev.savesCount + (wasSaved ? -1 : 1),
      }));

    } catch (err) {
      alert(err.message);
    } finally {
      setSaveLoading(false);
    }
  }}
  className={`ml-4 px-4 py-2 rounded ${
    isSaved ? "bg-yellow-600" : "bg-gray-700"
  } text-white`}
>
  {isSaved ? "💾 Saved" : "💾 Save"} ({list.savesCount})
</button>
  </div>
</div>

<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
  {items.map((item) => (
    <div key={item.id} className="relative group">
      <Link
        to={`/${item.mediaType}/${item.tmdbId}`}
        className="block"
      >
        <img
          src={item.posterPath}
          alt={item.title}
          className="w-full rounded"
        />
      </Link>

      {user && user.uid === list.ownerId && (
        <button
          onClick={() => handleRemove(item)}
          className="absolute top-1 right-1 bg-red-600 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
        >
          Remove
        </button>
      )}
    </div>
  ))}
</div>
      {hasMore && (
  <div className="text-center mt-6">
    <button
      onClick={loadMore}
      className="bg-gray-700 px-6 py-2 rounded text-white"
    >
      Load More
    </button>
  </div>
)}
<div className="mt-16">
  <h2 className="text-2xl font-bold mb-6">💬 Comments</h2>

  {user && (
    <div className="mb-6 flex gap-2">
      <input
        type="text"
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder="Write a comment..."
        className="flex-1 px-4 py-2 rounded bg-gray-800 text-white"
      />
      <button
        disabled={commentLoading}
        onClick={async () => {
          try {
            setCommentLoading(true);

            await addCommentToList({
              listId: id,
              text: commentText,
              user,
            });

            

            setCommentText("");
          } catch (err) {
            alert(err.message);
          } finally {
            setCommentLoading(false);
          }
        }}
        className="bg-blue-600 px-4 py-2 rounded"
      >
        Post
      </button>
    </div>
  )}

  <div className="space-y-4">
    {comments.map((comment) => (
      <div
        key={comment.id}
        className="bg-gray-800 p-4 rounded"
      >
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-sm text-blue-400">
            {comment.username}
          </span>

          {(user &&
            (user.uid === comment.userId ||
             user.uid === list.ownerId)) && (
            <button
              onClick={async () => {
                await deleteCommentFromList({
                  listId: id,
                  commentId: comment.id,
                  user,
                });


              }}
              className="text-xs text-red-400"
            >
              Delete
            </button>
          )}
        </div>

        <p className="text-sm text-gray-300">
          {comment.text}
        </p>
      </div>
    ))}

    {comments.length === 0 && (
      <p className="text-gray-500">No comments yet.</p>
    )}
  </div>
</div>

    </div>
  );
};

export default ListDetail;
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  increment,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// 🔹 Create List
export const createList = async ({
  title,
  description,
  isPublic,
  user,
}) => {
  if (!user) throw new Error("User not authenticated");

  if (!title || title.trim().length < 3) {
    throw new Error("Title must be at least 3 characters");
  }

  const listRef = collection(db, "lists");

  const newList = await addDoc(listRef, {
    title: title.trim(),
    description: description?.trim() || "",
    ownerId: user.uid,
    ownerUsername: user.displayName || "User",
    isPublic: isPublic ?? true,
    coverImage: null,
    likesCount: 0,
    savesCount: 0,
    itemsCount: 0,
    commentsCount: 0,
    trendingScore: 0,
    collaborators: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
  });

  return newList.id;
};


// 🔹 Add Item To List (Transaction Safe)
export const addItemToList = async ({
  listId,
  tmdbId,
  mediaType,
  title,
  posterPath,
  user,
}) => {
  if (!user) throw new Error("Not authenticated");

  const listRef = doc(db, "lists", listId);
  const itemId = `${tmdbId}_${mediaType}`;
  const itemRef = doc(collection(listRef, "items"), itemId);
  const activityRef = doc(collection(listRef, "activity"));

  await runTransaction(db, async (transaction) => {
    const listDoc = await transaction.get(listRef);

    if (!listDoc.exists()) {
      throw new Error("List does not exist");
    }

    const listData = listDoc.data();

    if (listData.ownerId !== user.uid) {
      throw new Error("Not authorized");
    }

    if (listData.itemsCount >= 500) {
      throw new Error("Maximum 500 items reached");
    }

    const existingItem = await transaction.get(itemRef);
    if (existingItem.exists()) {
      throw new Error("Item already exists in list");
    }

    const newPosition = listData.itemsCount + 1;

    // Create item
    transaction.set(itemRef, {
      tmdbId,
      mediaType,
      title,
      posterPath,
      position: newPosition,
      addedBy: user.uid,
      addedAt: serverTimestamp(),
    });

    // Update list counters
    transaction.update(listRef, {
      itemsCount: increment(1),
      updatedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      coverImage: listData.coverImage || posterPath || null,
    });

    // Add activity
    transaction.set(activityRef, {
      type: "add",
      userId: user.uid,
      username: user.displayName || "User",
      itemId,
      createdAt: serverTimestamp(),
    });
  });
};

export const removeItemFromList = async ({
  listId,
  tmdbId,
  mediaType,
  user,
}) => {
  if (!user) throw new Error("Not authenticated");

  const listRef = doc(db, "lists", listId);
  const itemId = `${tmdbId}_${mediaType}`;
  const itemRef = doc(collection(listRef, "items"), itemId);
  const activityRef = doc(collection(listRef, "activity"));

  await runTransaction(db, async (transaction) => {
    const listDoc = await transaction.get(listRef);
    if (!listDoc.exists()) throw new Error("List does not exist");

    const listData = listDoc.data();
    if (listData.ownerId !== user.uid) {
      throw new Error("Not authorized");
    }

    const itemDoc = await transaction.get(itemRef);
    if (!itemDoc.exists()) {
      throw new Error("Item not found");
    }

    transaction.delete(itemRef);

    transaction.update(listRef, {
      itemsCount: increment(-1),
      updatedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
    });

    transaction.set(activityRef, {
      type: "remove",
      userId: user.uid,
      username: user.displayName || "User",
      itemId,
      createdAt: serverTimestamp(),
    });
  });
};

// 🔹 Toggle Like List
export const toggleLikeList = async ({ listId, user }) => {
  if (!user) throw new Error("Not authenticated");

  const listRef = doc(db, "lists", listId);
  const likeRef = doc(db, "users", user.uid, "likedLists", listId);

  await runTransaction(db, async (transaction) => {
    const listSnap = await transaction.get(listRef);
    if (!listSnap.exists()) throw new Error("List not found");

    const listData = listSnap.data();
    const likeSnap = await transaction.get(likeRef);

    const isUnliking = likeSnap.exists();

    const newLikesCount = isUnliking
      ? (listData.likesCount || 0) - 1
      : (listData.likesCount || 0) + 1;

    const newScore = calculateTrendingScore({
      ...listData,
      likesCount: newLikesCount,
    });

    if (isUnliking) {
      transaction.delete(likeRef);
    } else {
      transaction.set(likeRef, {
        likedAt: serverTimestamp(),
      });
    }

    transaction.update(listRef, {
      likesCount: increment(isUnliking ? -1 : 1),
      trendingScore: newScore,
    });
  });
};

export const toggleFollowUser = async ({ currentUser, targetUserId }) => {
  if (!currentUser) throw new Error("Not authenticated");
  if (currentUser.uid === targetUserId) return;

  const followerRef = doc(
    db,
    "users",
    targetUserId,
    "followers",
    currentUser.uid
  );

  const followingRef = doc(
    db,
    "users",
    currentUser.uid,
    "following",
    targetUserId
  );

  await runTransaction(db, async (transaction) => {
    const followerSnap = await transaction.get(followerRef);

    if (followerSnap.exists()) {
      transaction.delete(followerRef);
      transaction.delete(followingRef);
    } else {
      transaction.set(followerRef, {
        followedAt: serverTimestamp(),
      });

      transaction.set(followingRef, {
        followedAt: serverTimestamp(),
      });
    }
  });
};

export const toggleSaveList = async ({ listId, user }) => {
  if (!user) throw new Error("Not authenticated");

  const listRef = doc(db, "lists", listId);
  const saveRef = doc(db, "users", user.uid, "savedLists", listId);

  await runTransaction(db, async (transaction) => {
    const listSnap = await transaction.get(listRef);
    if (!listSnap.exists()) throw new Error("List not found");

    const listData = listSnap.data();
    const saveSnap = await transaction.get(saveRef);

    const isUnsaving = saveSnap.exists();

    const newSavesCount = isUnsaving
      ? (listData.savesCount || 0) - 1
      : (listData.savesCount || 0) + 1;

    const newScore = calculateTrendingScore({
      ...listData,
      savesCount: newSavesCount,
    });

    if (isUnsaving) {
      transaction.delete(saveRef);
    } else {
      transaction.set(saveRef, {
        savedAt: serverTimestamp(),
      });
    }

    transaction.update(listRef, {
      savesCount: increment(isUnsaving ? -1 : 1),
      trendingScore: newScore,
    });
  });
};

export const addCommentToList = async ({ listId, text, user }) => {
  if (!user) throw new Error("Not authenticated");
  if (!text || text.trim().length < 1)
    throw new Error("Comment cannot be empty");

  const listRef = doc(db, "lists", listId);
  const commentRef = doc(collection(db, "lists", listId, "comments"));

  await runTransaction(db, async (transaction) => {
    const listSnap = await transaction.get(listRef);
    if (!listSnap.exists()) throw new Error("List not found");

    const listData = listSnap.data();

    transaction.set(commentRef, {
      userId: user.uid,
      username: user.displayName || "User",
      text: text.trim(),
      createdAt: serverTimestamp(),
    });

    const newCommentsCount = (listData.commentsCount || 0) + 1;

    const newScore = calculateTrendingScore({
      ...listData,
      commentsCount: newCommentsCount,
    });

    transaction.update(listRef, {
      commentsCount: increment(1),
      trendingScore: newScore,
    });
  });
};

export const deleteCommentFromList = async ({
  listId,
  commentId,
  user,
}) => {
  if (!user) throw new Error("Not authenticated");

  const listRef = doc(db, "lists", listId);
  const commentRef = doc(db, "lists", listId, "comments", commentId);

  await runTransaction(db, async (transaction) => {
    const listSnap = await transaction.get(listRef);
    if (!listSnap.exists()) throw new Error("List not found");

    const commentSnap = await transaction.get(commentRef);
    if (!commentSnap.exists()) throw new Error("Comment not found");

    const listData = listSnap.data();

    const newCommentsCount = Math.max(
      (listData.commentsCount || 0) - 1,
      0
    );

    const newScore = calculateTrendingScore({
      ...listData,
      commentsCount: newCommentsCount,
    });

    transaction.delete(commentRef);

    transaction.update(listRef, {
      commentsCount: increment(-1),
      trendingScore: newScore,
    });
  });
};

const calculateTrendingScore = (listData) => {
  if (!listData.createdAt?.toMillis) return 0;

  const hours =
    (Date.now() - listData.createdAt.toMillis()) / (1000 * 60 * 60);

  const engagement =
    (listData.likesCount || 0) * 3 +
    (listData.savesCount || 0) * 4 +
    (listData.commentsCount || 0) * 2;

  return engagement / (hours + 2);
};

// 🔹 Get Current User Lists (for modal)
export const getUserLists = async (userId) => {
  const q = query(
    collection(db, "lists"),
    where("ownerId", "==", userId),
    orderBy("updatedAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
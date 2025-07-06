// src/utils/firestore.js

import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

// Save a movie to user's watchlist
export async function addToWatchlist(userId, movie) {
  const movieRef = doc(db, "watchlists", `${userId}_${movie.id}`);
  await setDoc(movieRef, { ...movie, userId });
}

// Remove a movie
export async function removeFromWatchlist(userId, movieId) {
  const movieRef = doc(db, "watchlists", `${userId}_${movieId}`);
  await deleteDoc(movieRef);
}

// Get movie
export async function isInWatchlist(userId, movieId) {
  const movieRef = doc(db, "watchlists", `${userId}_${movieId}`);
  const docSnap = await getDoc(movieRef);
  return docSnap.exists();
}

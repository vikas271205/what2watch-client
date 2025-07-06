// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD_FgSWwflp7Y7EjsWxkiwS3wRYNYVxcZc",
  authDomain: "what2watch-271205.firebaseapp.com",
  projectId: "what2watch-271205",
  storageBucket: "what2watch-271205.firebasestorage.app",
  messagingSenderId: "1002672802486",
  appId: "1:1002672802486:web:f07028cd51a36815997417"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

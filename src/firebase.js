// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// --- FIX: Import the connectFirestoreEmulator function ---
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

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
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

// --- ADDED: This block connects your app to the local emulator ---
// It only runs when your app's hostname is "localhost".
/*if (window.location.hostname === "localhost") {
  console.log("Connecting to local Firestore emulator on localhost:8080...");
  connectFirestoreEmulator(db, 'localhost', 8080);
}*/
// --------------------------------------------------------------------

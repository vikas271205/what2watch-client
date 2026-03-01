import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

/* =======================
   APPLY THEME BEFORE APP
   ======================= */

const saved = localStorage.getItem("theme");

if (saved === "dark") {
  document.documentElement.classList.add("dark");
} else if (saved === "light") {
  document.documentElement.classList.remove("dark");
} else {
  // fallback to system preference
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.classList.add("dark");
  }
}

/* ======================= */

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <AuthProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AuthProvider>
);
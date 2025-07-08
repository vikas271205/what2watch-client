import { useEffect, useState } from "react";
import useDarkMode from "../utils/useDarkMode";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

export default function ThemeLayout() {
  const [darkMode] = useDarkMode();

  return (
    <div className="min-h-screen bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300">
      <Navbar />
      <Outlet />
    </div>
  );
}

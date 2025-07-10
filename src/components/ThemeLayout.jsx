import useDarkMode from "../utils/useDarkMode";
import Navbar from "./Navbar";
import { Outlet, Link } from "react-router-dom";

export default function ThemeLayout() {
  const [darkMode] = useDarkMode();

  return (
    <div className="min-h-screen bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300">
      <Navbar />
      <main className="pt-6 sm:pt-8">
        <Outlet />
      </main>

      {/* Floating Assistant Button */}
      <Link
        to="/assistant"
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 transition z-50"
      >
        💬 Ask Assistant
      </Link>
    </div>
  );
}

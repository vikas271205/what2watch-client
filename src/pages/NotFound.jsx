import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found 🔥</h1>
      <p className="text-gray-400 mb-6 max-w-md">
        Sorry, the page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded"
      >
        Go Back Home
      </Link>
    </div>
  );
}

export default NotFound;

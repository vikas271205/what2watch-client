import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

function GenresSection() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/genres`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.genres || [];
        setGenres(list.slice(0, 6)); // show top 6
      } catch (err) {
        console.error("Failed to fetch genres:", err);
        setError("Could not load genres 😕");
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">Loading genres…</p>;
  if (error) return <p className="text-red-400 text-sm">{error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">🎭 Popular Genres</h2>
        <Link to="/genres" className="text-sm text-blue-400 hover:underline">
          See All →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <Link
            key={genre.id}
            to={`/genres?g=${genre.id}`}
            className="px-4 py-2 rounded bg-gray-800 text-sm hover:bg-blue-600 transition"
          >
            {genre.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default GenresSection;

import { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import API_BASE from "../utils/api";
function TVShows() {
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [tvShows, setTVShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/genre/tv`);

        const data = await res.json();
        setGenres(data.genres);
        if (data.genres.length > 0) {
          setSelectedGenre(data.genres[0]);
        }
      } catch (err) {
        console.error("Failed to fetch genres:", err);
      }
    };

    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchTVShows = async () => {
      if (!selectedGenre) return;

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/discover/tv?with_genres=${selectedGenre.id}`);

        const data = await res.json();
        setTVShows(data.results.slice(0, 20));
      } catch (err) {
        console.error("Failed to fetch TV shows:", err);
        setTVShows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTVShows();
  }, [selectedGenre]);

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-10 py-6 bg-white text-black dark:bg-zinc-900 dark:text-white transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-6">📺 Popular TV Shows by Genre</h1>

      {/* Genre Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {genres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => setSelectedGenre(genre)}
            className={`px-4 py-2 rounded transition text-white ${
              selectedGenre?.id === genre.id
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-300">Loading TV shows...</p>
      ) : tvShows.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-300">No TV shows found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {tvShows.map((tv) => (
            <MovieCard
              key={tv.id}
              id={tv.id}
              title={tv.name}
              imageUrl={`https://image.tmdb.org/t/p/w300${tv.poster_path}`}
              publicRating={tv.vote_average}
              genres={[]}
              isTV={true}
              language={tv.original_language}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TVShows;

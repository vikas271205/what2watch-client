import { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import { useLoading } from "../context/LoadingContext";

import API_BASE from "../utils/api";

function Genres() {
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [movies, setMovies] = useState([]);
  const [genreMap, setGenreMap] = useState({});
  const { setIsLoading } = useLoading();

useEffect(() => {
  const fetchGenres = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/tmdb/genres`);
      const data = await res.json();

      setGenres(data);
      if (data.length > 0) setSelectedGenre(data[0]);

      const map = {};
      data.forEach((g) => {
        map[g.id] = g.name;
      });
      setGenreMap(map);
    } catch (e) {
      console.error("Failed to fetch genres", e);
    } finally {
      setIsLoading(false);
    }
  };

  fetchGenres();
}, []);


useEffect(() => {
  const fetchMoviesByGenre = async () => {
    if (!selectedGenre) return;

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/tmdb/byGenre?genreId=${selectedGenre.id}`);
      const data = await res.json();

      let filteredMovies = data.filter(
        (movie) => movie.adult === false && movie.poster_path
      );

      if (selectedGenre.name.toLowerCase() === "romance") {
        filteredMovies = filteredMovies.filter(
          (movie) => movie.original_language !== "ja"
        );
      }

      setMovies(filteredMovies.slice(0, 18));
    } catch (e) {
      console.error("Failed to fetch genre movies", e);
    } finally {
      setIsLoading(false);
    }
  };

  fetchMoviesByGenre();
}, [selectedGenre]);


  return (
    <main className="bg-white text-black dark:bg-zinc-900 dark:text-white">
      <h1 className="text-3xl font-bold mb-6">🎭 Browse by Genre</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {genres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => setSelectedGenre(genre)}
            className={`px-4 py-2 rounded ${
              selectedGenre?.id === genre.id ? "bg-blue-600" : "bg-gray-800"
            } hover:bg-blue-700 transition`}
          >
            {genre.name}
          </button>
        ))}
      </div>

      {selectedGenre && (
        <>
          <h2 className="text-xl font-semibold mb-4">🎬 {selectedGenre.name} Movies</h2>
          {movies.length === 0 ? (
            <p className="text-sm text-gray-400">No movies found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  id={movie.id}
                  title={movie.title}
                  imageUrl={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                  publicRating={movie.vote_average}
                  genres={movie.genre_ids?.map((id) => genreMap[id] || "")}
                  size="large"
                  language={movie.original_language}
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default Genres;

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
const API_BASE = process.env.REACT_APP_API_BASE_URL;

function CastDetail() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const fetchPersonDetails = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/person/${id}`);
        const data = await res.json();
        setPerson(data);
      } catch (err) {
        console.error("Failed to fetch person details:", err);
      }
    };

    const fetchPersonMovies = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/person/${id}/movies`);
        const data = await res.json();
        setMovies(data.cast.slice(0, 20));
      } catch (err) {
        console.error("Failed to fetch person movies:", err);
      }
    };

    fetchPersonDetails();
    fetchPersonMovies();
  }, [id]);

  if (!person) return <p className="p-6 text-white">Loading...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white px-4 py-6 max-w-5xl mx-auto relative overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6 items-start animate-fadeIn">
        <div className="flex-shrink-0 w-full md:w-48 rounded-xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
          <img
            src={
              person.profile_path
                ? `https://image.tmdb.org/t/p/w300${person.profile_path}`
                : "https://via.placeholder.com/300x450?text=No+Image"
            }
            alt={person.name}
            className="w-full h-auto object-cover rounded-xl"
          />
        </div>
        <div className="space-y-4 animate-slideUp">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide drop-shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            {person.name}
          </h1>
          <p className="text-gray-300 text-sm sm:text-md italic">{person.place_of_birth || "Unknown birthplace"}</p>
          <p className="text-gray-400 text-sm sm:text-md leading-relaxed max-w-prose">{person.biography || "No biography available."}</p>
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mt-8 sm:mt-12 mb-4 animate-fadeIn text-indigo-400">🎬 Known For</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
        {movies.map((movie) => (
          <a
            key={movie.id}
            href={`/movie/${movie.id}`}
            className="block rounded-xl overflow-hidden bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2"
          >
            <img
              src={
                movie.poster_path
                  ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                  : "https://via.placeholder.com/300x450?text=No+Image"
              }
              alt={movie.title}
              className="w-full h-32 sm:h-48 md:h-64 object-cover rounded-t-xl"
            />
            <p className="text-xs sm:text-sm text-center p-1 sm:p-2 text-gray-200 font-medium">{movie.title || movie.name}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

export default CastDetail;
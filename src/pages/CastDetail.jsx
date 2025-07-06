import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

function CastDetail() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const fetchPersonDetails = async () => {
      const res = await fetch(`${API_BASE}/api/tmdb/person/${id}`);
      const data = await res.json();
      setPerson(data);
    };

    const fetchPersonMovies = async () => {
      const res = await fetch(`${API_BASE}/api/tmdb/person/${id}/movies`);
      const data = await res.json();
      setMovies(data.cast.slice(0, 20)); // Top 20 movies
    };

    fetchPersonDetails();
    fetchPersonMovies();
  }, [id]);

  if (!person) return <p className="p-6 text-white">Loading...</p>;

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        <img
          src={`https://image.tmdb.org/t/p/w300${person.profile_path}`}
          alt={person.name}
          className="w-48 h-auto rounded-lg"
        />
        <div>
          <h1 className="text-3xl font-bold mb-2">{person.name}</h1>
          <p className="text-gray-300 text-sm mb-2">{person.place_of_birth}</p>
          <p className="text-gray-400 text-sm">{person.biography || "No biography available."}</p>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mt-10 mb-4">🎬 Known For</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {movies.map((movie) => (
          <a key={movie.id} href={`/movie/${movie.id}`} className="block">
            <img
              src={
                movie.poster_path
                  ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                  : "https://via.placeholder.com/300x450?text=No+Image"
              }
              alt={movie.title}
              className="rounded-md w-full mb-1"
            />
            <p className="text-sm text-center">{movie.title}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

export default CastDetail;

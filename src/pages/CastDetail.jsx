import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API_BASE from "../utils/api";
import { useLoading } from "../context/LoadingContext";
import ShimmerListGrid from "../components/ShimmerListGrid";

function CastDetail() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [movies, setMovies] = useState([]);
  const { setIsLoading } = useLoading();

  useEffect(() => {
    const fetchPersonDetails = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/tmdb/person/${id}`);
        const data = await res.json();
        setPerson(data);
      } catch (err) {
        console.error("Failed to fetch person details:", err);
      } finally {
        setIsLoading(false);
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
  }, [id, setIsLoading]);

  if (!person)
    return (
      <div className="p-6">
        <ShimmerListGrid count={4} />
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white px-4 py-6 max-w-5xl mx-auto relative overflow-hidden">
      {/* Profile Header */}
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
          <p className="text-gray-300 text-sm sm:text-md italic">
            {person.place_of_birth || "Unknown birthplace"}
          </p>
          <p className="text-gray-400 text-sm sm:text-md leading-relaxed max-w-prose">
            {person.biography || "No biography available."}
          </p>
        </div>
      </div>

      {/* Known For */}
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mt-8 sm:mt-12 mb-4 animate-fadeIn text-indigo-400">
        🎬 Known For
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
        {movies.map((movie) => {
          const isTV = !!movie.name;
          const title = movie.title || movie.name;
          const link = isTV ? `/tv/${movie.id}` : `/movie/${movie.id}`;
          return (
            <Link
              key={movie.id}
              to={link}
              className="block rounded-xl overflow-hidden bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2"
            >
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                    : "https://via.placeholder.com/300x450?text=No+Image"
                }
                alt={title}
                className="w-full h-32 sm:h-48 md:h-64 object-cover rounded-t-xl"
                loading="lazy"
              />
              <p className="text-xs sm:text-sm text-center p-1 sm:p-2 text-gray-200 font-medium">
                {title}
              </p>
            </Link>
          );
        })}
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
          .animate-slideUp { animation: slideUp 0.6s ease-out; }
        `}
      </style>
    </div>
  );
}

export default CastDetail;

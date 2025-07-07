import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API_BASE from "../utils/api";
import { useLoading } from "../context/LoadingContext";
import ShimmerListGrid from "../components/ShimmerListGrid";
import { motion } from "framer-motion";

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
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
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
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setMovies(data.cast.slice(0, 10).filter(item => item.poster_path)); // Limit to 10 with posters
      } catch (err) {
        console.error("Failed to fetch person movies:", err);
      }
    };

    fetchPersonDetails();
    fetchPersonMovies();
  }, [id, setIsLoading]);

  if (!person) return (
    <div className="p-4 sm:p-6">
      <ShimmerListGrid count={4} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white px-4 sm:px-6 py-6 max-w-6xl mx-auto">
      {/* Profile Header */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex-shrink-0 w-32 sm:w-48 rounded-xl overflow-hidden shadow-lg">
          <img
            src={
              person.profile_path
                ? `https://image.tmdb.org/t/p/w300${person.profile_path}`
                : "https://via.placeholder.com/300x450?text=No+Image"
            }
            alt={person.name}
            className="w-full aspect-[2/3] object-cover rounded-xl"
            loading="lazy"
          />
        </div>
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
            {person.name}
          </h1>
          <p className="text-sm sm:text-base text-gray-300 italic">
            {person.place_of_birth || "Unknown birthplace"}
          </p>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-prose line-clamp-6">
            {person.biography || "No biography available."}
          </p>
        </div>
      </motion.div>

      {/* Known For */}
      <motion.h2
        className="text-lg sm:text-xl md:text-2xl font-semibold mt-6 sm:mt-8 mb-3 sm:mb-4 text-indigo-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        🎬 Known For
      </motion.h2>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-800">
        {movies.map((movie) => {
          const isTV = !!movie.name;
          const title = movie.title || movie.name;
          const link = isTV ? `/tv/${movie.id}` : `/movie/${movie.id}`;
          return (
            <Link
              key={movie.id}
              to={link}
              className="flex-shrink-0 w-32 sm:w-40 rounded-xl overflow-hidden bg-gray-800 shadow-lg"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <img
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                      : "https://via.placeholder.com/300x450?text=No+Image"
                  }
                  alt={title}
                  className="w-full h-48 sm:h-56 object-cover rounded-t-xl"
                  loading="lazy"
                />
                <p className="text-xs sm:text-sm text-center p-2 text-gray-200 font-medium line-clamp-2">
                  {title}
                </p>
              </motion.div>
            </Link>
          );
        })}
      </div>

      <style>
        {`
          .scrollbar-thin::-webkit-scrollbar {
            height: 8px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: #6366f1;
            border-radius: 4px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background-color: #1f2937;
          }
        `}
      </style>
    </div>
  );
}

export default CastDetail;
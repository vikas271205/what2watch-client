// src/pages/CastDetail.jsx

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useColor } from "color-thief-react";
import API_BASE from "../utils/api";
import ShimmerDetail from "../components/ShimmerDetail";
import MovieCard from "../components/MovieCard";
import { Cake, Globe, TrendingUp, Briefcase, Clapperboard } from "lucide-react";

const CastDetail = () => {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [allCredits, setAllCredits] = useState([]); // Holds all combined credits
  const [knownFor, setKnownFor] = useState([]);
  const [activeTab, setActiveTab] = useState("Acting"); // Default to Acting
  const [showFullBiography, setShowFullBiography] = useState(false);

  const profilePath = person?.profile_path ? `https://image.tmdb.org/t/p/w300${person.profile_path}` : null;
  const { data: dominantColor } = useColor(
    person?.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : null,
    'hex',
    { crossOrigin: 'anonymous', quality: 10 }
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    setPerson(null);

    const fetchPersonDetails = async () => {
      try {
        const [personRes, combinedCreditsRes] = await Promise.all([
          fetch(`${API_BASE}/api/tmdb/person/${id}`),
          fetch(`${API_BASE}/api/tmdb/person/${id}/combined_credits`),
        ]);

        const personData = await personRes.json();
        setPerson(personData);

        const creditsData = await combinedCreditsRes.json();
        
        // --- FIX: Combine both cast (acting) and crew (directing, etc.) roles ---
        const castCredits = creditsData.cast.map(c => ({ ...c, department: 'Acting' }));
        const crewCredits = creditsData.crew;
        const combined = [...castCredits, ...crewCredits];

        // Filter out duplicates and invalid media types, then sort by date
        const uniqueAndSortedCredits = combined
          .filter((credit, index, self) =>
              index === self.findIndex(c => c.id === credit.id) && // Remove duplicates
              (credit.media_type === "movie" || credit.media_type === "tv") // Ensure it's a movie or TV show
          )
          .sort((a, b) => {
              const dateA = new Date(a.release_date || a.first_air_date);
              const dateB = new Date(b.release_date || b.first_air_date);
              if (isNaN(dateA)) return 1;
              if (isNaN(dateB)) return -1;
              return dateB - dateA;
          });

        setAllCredits(uniqueAndSortedCredits);

        setKnownFor(
          uniqueAndSortedCredits
            .filter(credit => credit.poster_path)
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 10)
        );

      } catch (err) {
        console.error("Failed to fetch person details:", err);
      }
    };

    fetchPersonDetails();
  }, [id]);

  if (!person) {
    return <ShimmerDetail />;
  }

  // Group the combined filmography by department
  const groupedFilmography = allCredits.reduce((acc, credit) => {
    const department = credit.department || 'Uncategorized';
    if (!acc[department]) {
      acc[department] = [];
    }
    acc[department].push(credit);
    return acc;
  }, {});

  // Define and sort the departments for the tabs, ensuring 'Acting' is first
  const desiredDepartments = ['Acting', 'Directing', 'Writing', 'Production'];
  const filmographyDepartments = Object.keys(groupedFilmography)
    .filter(dep => desiredDepartments.includes(dep))
    .sort((a, b) => {
      if (a === 'Acting') return -1;
      if (b === 'Acting') return 1;
      return a.localeCompare(b);
    });
  
  const getYear = (item) => (item.release_date || item.first_air_date || '').split('-')[0];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100" style={{ '--dominant-color': dominantColor || '#4f46e5' }}>
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-top bg-gray-800" style={{ 
            backgroundImage: knownFor[0]?.backdrop_path 
                ? `url(https://image.tmdb.org/t/p/w1280${knownFor[0].backdrop_path})`
                : `linear-gradient(to right, ${dominantColor || '#1a202c'}EE, ${dominantColor || '#2d3748'}AA)`
            }}>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 md:-mt-40">
        <motion.div 
          className="bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 border border-gray-700"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.img 
            src={profilePath || "https://placehold.co/300x450/1f2937/FFFFFF?text=No+Image"} 
            alt={person.name} 
            className="w-40 h-60 sm:w-52 sm:h-72 rounded-xl object-cover shadow-lg flex-shrink-0 border-4 border-[var(--dominant-color)]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-white">
              {person.name}
            </h1>
            <p className="text-xl text-gray-300 mb-4">{person.place_of_birth}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-gray-400">
              {person.birthday && (
                <span className="flex items-center">
                  <Cake size={16} className="mr-1 text-[var(--dominant-color)]" /> Born: {new Date(person.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              )}
              {person.popularity && (
                <span className="flex items-center">
                  <TrendingUp size={16} className="mr-1 text-[var(--dominant-color)]" /> Popularity: {person.popularity.toFixed(1)}
                </span>
              )}
              {person.homepage && (
                <a href={person.homepage} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-white transition-colors">
                  <Globe size={16} className="mr-1 text-[var(--dominant-color)]" /> Official Site
                </a>
              )}
            </div>
            
            <div className="mt-6 text-gray-300 leading-relaxed">
              <h2 className="text-xl font-semibold mb-2 text-white">Biography</h2>
              {person.biography ? (
                <>
                  <p className={`whitespace-pre-wrap ${showFullBiography ? '' : 'line-clamp-4'}`}>
                    {person.biography}
                  </p>
                  {person.biography.length > 300 && (
                    <button 
                      onClick={() => setShowFullBiography(!showFullBiography)} 
                      className="mt-2 text-[var(--dominant-color)] hover:underline text-sm font-semibold"
                    >
                      {showFullBiography ? "Show Less" : "Show More"}
                    </button>
                  )}
                </>
              ) : (
                <p>No biography available.</p>
              )}
            </div>
          </div>
        </motion.div>

        {knownFor.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-2">
                <Briefcase className="text-[var(--dominant-color)]" size={28}/> Known For
            </h2>
            <motion.div 
              className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 custom-scrollbar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {knownFor.map((item) => (
                <div key={item.credit_id || item.id} className="w-40 sm:w-48 flex-shrink-0">
                    <MovieCard
                        id={item.id}
                        title={item.title || item.name}
                        imageUrl={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                        isTV={item.media_type === "tv"}
                        year={getYear(item)}
                        tmdbRating={item.vote_average}
                        showUncleScore={false}
                    />
                </div>
              ))}
            </motion.div>
          </div>
        )}

        {allCredits.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-2">
                <Clapperboard className="text-[var(--dominant-color)]" size={28}/> Filmography
            </h2>
            
            {filmographyDepartments.length > 1 && (
                <div className="border-b border-gray-700 mb-6 -mx-4 px-4 overflow-x-auto custom-scrollbar">
                    <nav className="flex space-x-4">
                        {filmographyDepartments.map(department => (
                            <button
                                key={department}
                                onClick={() => setActiveTab(department)}
                                className={`px-4 py-2 text-base font-semibold rounded-t-lg transition-colors duration-300 relative whitespace-nowrap ${
                                    activeTab === department 
                                    ? "text-white border-b-2 border-[var(--dominant-color)]" 
                                    : "text-gray-400 hover:text-white"
                                }`}
                            >
                                {department}
                            </button>
                        ))}
                    </nav>
                </div>
            )}

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8"
            >
                {groupedFilmography[activeTab]?.map((item) => (
                    <MovieCard
                        key={item.credit_id || item.id}
                        id={item.id}
                        title={item.title || item.name}
                        imageUrl={item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null}
                        isTV={item.media_type === "tv"}
                        year={getYear(item)}
                        tmdbRating={item.vote_average}
                        showUncleScore={false}
                    />
                ))}
            </motion.div>
          </div>
        )}
      </div>
      <div className="h-16"></div>
    </div>
  );
};

export default CastDetail;

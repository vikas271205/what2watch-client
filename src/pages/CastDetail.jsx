// src/pages/CastDetail.jsx

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useColor } from "color-thief-react";
import API_BASE from "../utils/api";
import ShimmerDetail from "../components/ShimmerDetail";
import MovieCard from "../components/MovieCard";
import { Cake, Globe, TrendingUp, Briefcase, Clapperboard, User, MapPin, Film, Tv } from "lucide-react";

// Helper function to calculate age
const calculateAge = (birthday, deathday = null) => {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  const endDate = deathday ? new Date(deathday) : new Date();
  let age = endDate.getFullYear() - birthDate.getFullYear();
  const m = endDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Helper function to lighten a hex color
const lightenColor = (hex, percent) => {
  if (!hex) return 'rgba(255, 255, 255, 0.7)';
  
  let r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);

  r = Math.min(255, r + (r * percent / 100));
  g = Math.min(255, g + (g * percent / 100));
  b = Math.min(255, b + (b * percent / 100));

  return `#${(Math.round(r) << 16 | Math.round(g) << 8 | Math.round(b)).toString(16).padStart(6, '0')}`;
};

const CastDetail = () => {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [allCredits, setAllCredits] = useState([]);
  const [knownFor, setKnownFor] = useState([]);
  const [activeTab, setActiveTab] = useState("Acting");
  const [showFullBiography, setShowFullBiography] = useState(false);

  const profilePath = person?.profile_path ? `https://image.tmdb.org/t/p/h632${person.profile_path}` : null;
  const backdropPath = knownFor[0]?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${knownFor[0].backdrop_path}` : null;

  const { data: dominantColor } = useColor(profilePath, 'hex', {
    crossOrigin: 'anonymous',
    quality: 10,
  });

  const lightenedDominantColor = dominantColor ? lightenColor(dominantColor, 80) : '#BB86FC';

  useEffect(() => {
    window.scrollTo(0, 0);
    setPerson(null);

    const fetchPersonDetails = async () => {
      try {
        const [personRes, combinedCreditsRes] = await Promise.all([
          fetch(`${API_BASE}/api/tmdb/person/${id}`),
          fetch(`${API_BASE}/api/tmdb/person/${id}/combined_credits`),
        ]);

        if (!personRes.ok || !combinedCreditsRes.ok) {
            throw new Error('Failed to fetch data from TMDB API');
        }
        
        const personData = await personRes.json();
        const creditsData = await combinedCreditsRes.json();
        
        setPerson(personData);
        
        const castCredits = creditsData.cast.map(c => ({ ...c, department: 'Acting' }));
        const crewCredits = creditsData.crew;
        const combined = [...castCredits, ...crewCredits];

        const uniqueAndSortedCredits = combined
          .filter((credit, index, self) =>
              credit.id && index === self.findIndex(c => c.id === credit.id) &&
              (credit.media_type === "movie" || credit.media_type === "tv")
          )
          .sort((a, b) => {
              const dateA = new Date(a.release_date || a.first_air_date);
              const dateB = new Date(b.release_date || b.first_air_date);
              if (isNaN(dateA)) return 1;
              if (isNaN(dateB)) return -1;
              return dateB - dateA;
          });

        setAllCredits(uniqueAndSortedCredits);
        
        const knownForCredits = (personData.known_for_department === 'Acting' ? creditsData.cast : combined)
          .filter(credit => 
            credit.poster_path && 
            credit.vote_count > 50 && 
            (!credit.character || !/self|host|guest|himself|herself/i.test(credit.character))
          )
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 10);
          
        setKnownFor(knownForCredits.length > 0 ? knownForCredits : uniqueAndSortedCredits.slice(0, 10));

      } catch (err) {
        console.error("Failed to fetch person details:", err);
      }
    };

    fetchPersonDetails();
  }, [id]);

  if (!person) {
    return <ShimmerDetail />;
  }

  const groupedFilmography = allCredits.reduce((acc, credit) => {
    const department = credit.department || 'Uncategorized';
    if (!acc[department]) acc[department] = [];
    acc[department].push(credit);
    return acc;
  }, {});

  const desiredDepartments = ['Acting', 'Directing', 'Writing', 'Production', 'Creator'];
  const filmographyDepartments = Object.keys(groupedFilmography)
    .filter(dep => desiredDepartments.includes(dep))
    .sort((a, b) => {
      if (a === 'Acting') return -1;
      if (b === 'Acting') return 1;
      return a.localeCompare(b);
    });

  const getYear = (item) => (item.release_date || item.first_air_date || 'TBA').split('-')[0];
  const age = calculateAge(person.birthday, person.deathday);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100" style={{ '--dominant-color': dominantColor || '#4a044e', '--dominant-color-light': lightenedDominantColor }}>
      {/* --- HERO SECTION --- */}
      <div className="relative w-full h-[50vh] md:h-[60vh]">
        <div className="absolute inset-0 overflow-hidden">
          {backdropPath && (
            <img src={backdropPath} alt="" className="w-full h-full object-cover object-top" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/50 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-12">
            <motion.div 
                className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <img 
                    src={profilePath || "https://placehold.co/500x750/1f2937/FFFFFF?text=No+Image"} 
                    alt={person.name} 
                    className="w-48 md:w-60 h-auto rounded-xl object-cover shadow-2xl border-4 border-gray-800/50"
                />
                <div className="text-center md:text-left">
                    <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-white">{person.name}</h1>
                    <span className="flex items-center justify-center md:justify-start text-gray-300 mt-2">
                        <TrendingUp size={16} className="mr-2 text-[var(--dominant-color-light)]" /> Popularity: {person.popularity?.toFixed(1) || 'N/A'}
                    </span>
                </div>
            </motion.div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-12 gap-8 lg:gap-12">
          
          {/* --- LEFT CONTENT AREA --- */}
          <motion.div 
            className="col-span-12 md:col-span-4 lg:col-span-3"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
             <div className="md:sticky md:top-24 self-start bg-gray-800/30 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-white border-b-2 border-[var(--dominant-color-light)] pb-2 mb-4">Personal Info</h3>
                <div className="space-y-4 text-gray-200">
                    <div className="flex items-start">
                        <Cake size={20} className="mr-3 mt-1 text-[var(--dominant-color-light)] flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-white">Born</p>
                            <p>{person.birthday ? new Date(person.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                            {age && <p className="text-sm text-gray-300">({age} years old)</p>}
                        </div>
                    </div>
                    <div className="flex items-start">
                        <MapPin size={20} className="mr-3 mt-1 text-[var(--dominant-color-light)] flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-white">Place of Birth</p>
                            <p>{person.place_of_birth || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <User size={20} className="mr-3 mt-1 text-[var(--dominant-color-light)] flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-white">Known For</p>
                            <p>{person.known_for_department || 'N/A'}</p>
                        </div>
                    </div>
                    {person.homepage && (
                        <a href={person.homepage} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-[var(--dominant-color-light)] transition-colors group">
                        <Globe size={20} className="mr-3 text-[var(--dominant-color-light)] flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-white">Official Site</p>
                            <p className="text-sm group-hover:underline">Visit Website</p>
                        </div>
                        </a>
                    )}
                </div>
            </div>
          </motion.div>
          
          {/* --- RIGHT CONTENT AREA --- */}
          <motion.div 
            className="col-span-12 md:col-span-8 lg:col-span-9"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            <div className="text-gray-200 leading-relaxed prose prose-invert max-w-none mb-12" style={{'--tw-prose-body': 'hsl(220 14% 86%)'}}>
              <h2 className="text-3xl font-bold mb-4 text-white flex items-center">Biography</h2>
              {person.biography ? (
                <>
                  <p className={`whitespace-pre-wrap ${showFullBiography ? '' : 'line-clamp-6'}`}>
                    {person.biography}
                  </p>
                  {person.biography.length > 500 && (
                    <button
                      onClick={() => setShowFullBiography(!showFullBiography)}
                      className="mt-3 px-4 py-2 rounded-md text-sm font-semibold bg-cyan-400 text-gray-900 hover:bg-cyan-300 transition-all shadow-md hover:shadow-lg"
                    >
                      {showFullBiography ? "Show Less" : "Read More"}
                    </button>
                  )}
                </>
              ) : <p>No biography available.</p>}
            </div>

            {knownFor.length > 0 && (
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-4 text-white flex items-center gap-2"><Briefcase className="text-[var(--dominant-color-light)]" size={28}/> Known For</h2>
                <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 custom-scrollbar">
                  {knownFor.map((item) => (
                    <div key={`known-${item.id}`} className="w-40 sm:w-44 flex-shrink-0">
                      <MovieCard id={item.id} title={item.title || item.name} imageUrl={`https://image.tmdb.org/t/p/w342${item.poster_path}`} isTV={item.media_type === "tv"} year={getYear(item)} tmdbRating={item.vote_average} showUncleScore={false} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allCredits.length > 0 && (
              <div>
                <h2 className="text-3xl font-bold mb-4 text-white flex items-center gap-2"><Clapperboard className="text-[var(--dominant-color-light)]" size={28}/> Filmography</h2>
                {filmographyDepartments.length > 1 && (
                  <div className="border-b border-gray-700 mb-6">
                    <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto custom-scrollbar">
                      {filmographyDepartments.map(dep => (
                        <button
                          key={dep}
                          onClick={() => setActiveTab(dep)}
                          className={`px-3 py-2 rounded-t-md text-sm sm:text-base font-semibold transition-all duration-300 whitespace-nowrap ${
                            activeTab === dep
                              ? "bg-cyan-400 text-gray-900 shadow-md"
                              : "bg-gray-800/50 text-gray-200 hover:bg-gray-700 hover:text-white"
                          }`}
                        >
                          {dep} ({groupedFilmography[dep].length})
                        </button>
                      ))}
                    </nav>
                  </div>
                )}
                <div className="flow-root">
                    <ul className="-my-4 divide-y divide-gray-800">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {groupedFilmography[activeTab]?.map((item) => (
                                    <li key={`${item.credit_id}-${item.id}`} className="py-4 group">
                                      <Link to={`/${item.media_type === 'tv' ? 'tv' : 'movie'}/${item.id}`} className="flex items-center space-x-4 p-2 -m-2 rounded-lg hover:bg-gray-800/60 transition-colors duration-200">
                                          <img 
                                            src={item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : "https://placehold.co/92x138/1f2937/FFFFFF?text=N/A"}
                                            alt={item.title || item.name}
                                            className="w-16 h-24 object-cover rounded-md bg-gray-800"
                                            loading="lazy"
                                          />
                                          <p className="text-lg font-bold text-gray-300 w-16 text-center">{getYear(item)}</p>
                                          <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <span className="text-gray-500">{item.media_type === 'movie' ? <Film size={16}/> : <Tv size={16}/>}</span>
                                                <p className="font-bold text-white group-hover:text-[var(--dominant-color-light)] transition-colors">{item.title || item.name}</p>
                                              </div>
                                              {item.character && <p className="text-sm text-gray-300 mt-1">as {item.character}</p>}
                                              {item.job && <p className="text-sm text-gray-300 mt-1">{item.job}</p>}
                                          </div>
                                      </Link>
                                    </li>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </ul>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CastDetail;

import { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import { calculateUncleScore } from "../utils/uncleScore";
const API_BASE = process.env.REACT_APP_API_BASE_URL;

function Recommended() {
  const [recommended, setRecommended] = useState([]);
  const [genreList, setGenreList] = useState({});

  useEffect(() => {
    const fetchGenres = async () => {
      const res = await fetch(`${API_BASE}/api/tmdb/genres`);

      const data = await res.json();
      const genreMap = {};
      data.forEach((g) => (genreMap[g.id] = g.name));
      setGenreList(genreMap);
    };

    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`${API_BASE}/api/tmdb/discover`);

      const data = await res.json();
      const filtered = [];

      for (const item of data) {
        const title = item.title || item.name;
        const rating = item.vote_average;
        if (!title || !rating) continue;

        try {
          const omdbRes = await fetch(`${API_BASE}/api/omdb?title=${encodeURIComponent(title)}`);

          const omdb = await omdbRes.json();

          const rtRating = omdb?.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value;
          const imdbRating = omdb?.imdbRating;
          const uncleScore = calculateUncleScore(rating, imdbRating, rtRating);

          const genres = item.genre_ids?.map((id) => genreList[id]).filter(Boolean);
          const lang = item.original_language;

          if (uncleScore >= 7.5) {
            filtered.push({
              id: item.id,
              title,
              imageUrl: `https://image.tmdb.org/t/p/w300${item.poster_path}`,
              rating,
              language: lang,
              genres,
              isTV: !!item.name,
            });
          }
        } catch (e) {
          console.error("OMDb fetch failed for:", title, e);
        }
      }

      setRecommended(filtered);
    };

    if (Object.keys(genreList).length > 0) {
      fetchData();
    }
  }, [genreList]);

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10 max-w-6xl mx-auto bg-white text-black dark:bg-zinc-900 dark:text-white transition-colors duration-300">
      <h2 className="text-3xl font-bold mb-6 text-center sm:text-left">🎯 Recommended</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {recommended.map((item) => (
          <MovieCard
            key={item.id}
            id={item.id}
            title={item.title}
            imageUrl={item.imageUrl}
            publicRating={item.rating}
            isTV={item.isTV}
            genres={item.genres}
            language={item.language}
          />
        ))}
      </div>
    </div>
  );
}

export default Recommended;

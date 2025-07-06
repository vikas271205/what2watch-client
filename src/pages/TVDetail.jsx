import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { calculateUncleScore } from "../utils/uncleScore";
import { fetchOMDbData } from "../api/omdb"; // still uses backend route

function TVDetail() {
  const { id } = useParams();
  const [tv, setTV] = useState(null);
  const [trailerUrl, setTrailerUrl] = useState("");
  const [cast, setCast] = useState([]);
  const [omdbData, setOmdbData] = useState(null);
  const [uncleScore, setUncleScore] = useState(null);

  useEffect(() => {
    const fetchTVData = async () => {
      try {
        const res = await fetch(`/api/tmdb/tv/${id}`);
        const data = await res.json();
        setTV(data);

        const omdb = await fetchOMDbData(data.name);
        setOmdbData(omdb);

        const imdb = omdb?.imdbRating || 0;
        const rt = omdb?.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value || "0%";
        setUncleScore(calculateUncleScore(data.vote_average, imdb, rt));

        const trailerRes = await fetch(`/api/tmdb/tv/${id}/videos`);
        const trailerData = await trailerRes.json();
        const trailer = trailerData.results.find((v) => v.type === "Trailer" && v.site === "YouTube");
        if (trailer) setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}`);

        const castRes = await fetch(`/api/tmdb/tv/${id}/credits`);
        const castData = await castRes.json();
        setCast(castData.cast.slice(0, 8));
      } catch (err) {
        console.error("TVDetail Fetch Error:", err);
      }
    };

    fetchTVData();
  }, [id]);

  if (!tv) return <p className="p-6 text-white">Loading...</p>;

  return (
    <div className="relative min-h-screen text-white bg-black">
      <div
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center brightness-50"
        style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${tv.backdrop_path})` }}
      ></div>

      <div className="relative z-10 px-4 py-8 sm:px-6 md:px-10 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <img
            src={`https://image.tmdb.org/t/p/w300${tv.poster_path}`}
            alt={tv.name}
            className="rounded-lg w-full md:w-48 shadow-lg"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{tv.name}</h1>
            <p className="text-gray-300 mb-1">{tv.genres?.map((g) => g.name).join(", ")}</p>
            <p className="text-yellow-400 font-semibold mb-1">⭐ TMDB: {tv.vote_average?.toFixed(1)}</p>

            {omdbData && (
              <>
                <p className="text-blue-300 text-sm">IMDb: {omdbData.imdbRating || "N/A"}</p>
                <p className="text-green-300 text-sm">
                  Rotten Tomatoes: {omdbData.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value || "N/A"}
                </p>
                <p className="text-purple-400 text-sm font-bold mt-1">🎯 Uncle Score: {uncleScore || "N/A"}</p>
              </>
            )}

            <p className="text-sm text-gray-200 mt-4">{tv.overview}</p>
          </div>
        </div>

        {trailerUrl && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-2">🎬 Watch Trailer</h2>
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={trailerUrl}
                title="TV Trailer"
                allowFullScreen
                className="rounded-lg w-full"
              ></iframe>
            </div>
          </div>
        )}

        {cast.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4">👥 Cast</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {cast.map((actor) => (
                <div key={actor.id} className="min-w-[100px] shrink-0 text-center">
                  <img
                    src={
                      actor.profile_path
                        ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                        : "https://via.placeholder.com/185x278?text=No+Image"
                    }
                    alt={actor.name}
                    className="rounded-md w-full mb-2"
                  />
                  <p className="text-sm font-medium">{actor.name}</p>
                  <p className="text-xs text-gray-400">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TVDetail;

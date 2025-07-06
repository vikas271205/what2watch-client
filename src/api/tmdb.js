const API_BASE = process.env.REACT_APP_API_BASE_URL;

export const fetchTrendingMovies = async () => {
  const res = await fetch(`${API_BASE}/api/tmdb/trending`);
  return await res.json();
};

export const fetchGenres = async () => {
  const res = await fetch(`${API_BASE}/api/tmdb/genres`);
  return await res.json();
};

export const fetchMoviesByGenre = async (genreId) => {
  const res = await fetch(`${API_BASE}/api/tmdb/byGenre?genreId=${genreId}`);
  return await res.json();
};

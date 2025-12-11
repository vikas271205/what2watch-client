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

export const fetchHiddenGems = async () => {
  const url = `${API_BASE}/api/hidden-gems`;

  console.log("[client] fetchHiddenGems →", url);

  try {
    const res = await fetch(url);
    console.log("[client] HiddenGems status:", res.status);

    if (!res.ok) {
      const body = await res.text();
      console.log("[client] HiddenGems error body:", body.slice(0, 200));
      return [];
    }

    const data = await res.json();
    console.log("[client] HiddenGems length:", Array.isArray(data) ? data.length : "not array");
    return data;
  } catch (err) {
    console.error("[client] HiddenGems fetch error:", err);
    return [];
  }
};



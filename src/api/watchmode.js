const API_BASE = process.env.REACT_APP_API_BASE_URL;

export const getWatchmodeId = async (title, year, tmdbId) => {
  try {
    const res = await fetch(
      `${API_BASE}/api/watchmode/id?title=${encodeURIComponent(title)}&year=${year}&tmdbId=${tmdbId}`
    );
    const data = await res.json();
    return data.id;
  } catch (err) {
    console.error("Watchmode ID fetch failed:", err);
    return null;
  }
};


export const getStreamingSources = async (watchmodeId) => {
  try {
    const res = await fetch(`${API_BASE}/api/watchmode/sources/${watchmodeId}`);
    return await res.json();
  } catch (err) {
    console.error("Streaming sources fetch failed:", err);
    return [];
  }
};

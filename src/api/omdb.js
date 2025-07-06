const API_BASE = process.env.REACT_APP_API_BASE_URL;

export const fetchOMDbData = async (title, year) => {
  if (!title) return null;

  try {
    const params = new URLSearchParams({ title });
    if (year) params.append("year", year);

    const response = await fetch(`${API_BASE}/api/omdb?${params}`);
    const data = await response.json();

    if (!data.error) return data;
    else {
      console.warn("OMDb error:", data.error);
      return null;
    }
  } catch (err) {
    console.error("OMDb fetch failed:", err);
    return null;
  }
};

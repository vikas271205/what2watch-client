const API_BASE = process.env.REACT_APP_API_BASE_URL;

export const fetchOMDbData = async (title, year) => {
  if (!title) {
    console.warn("fetchOMDbData: Title is required");
    return null;
  }

  try {
    const params = new URLSearchParams({ title });
    if (year) params.append("year", year);

    const response = await fetch(`${API_BASE}/api/omdb?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.warn(`OMDb API error for title "${title}"${year ? ` year ${year}` : ""}: ${data.error}`);
      return null;
    }

    return {
      imdbRating: data.imdbRating,
      Ratings: data.Ratings || [],
    };
  } catch (err) {
    console.error(`OMDb fetch failed for title "${title}"${year ? ` year ${year}` : ""}:`, err);
    return null;
  }
};
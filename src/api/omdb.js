// client/api/omdb.js
const API_BASE = process.env.REACT_APP_API_BASE_URL;
const failedCache = new Set(); // ⛔ in-memory fail cache

export const fetchOMDbData = async (title, year) => {
  if (!title || (year && Number(year) > new Date().getFullYear())) {
    console.log(`⏭️ Skipping OMDb for unreleased: ${title} (${year})`);
    return null;
  }

  const key = `${title}_${year}`;
  if (failedCache.has(key)) {
    console.log(`🚫 Skipping cached failed OMDb fetch for: ${title} (${year})`);
    return null;
  }

  try {
    const params = new URLSearchParams({ title });
    if (year) params.append("year", year);

    const response = await fetch(`${API_BASE}/api/omdb?${params}`);
    const contentType = response.headers.get("content-type");

    // Detect invalid HTML error page
    if (!contentType?.includes("application/json")) {
      const html = await response.text();
      failedCache.add(key);
      console.warn(`❌ OMDb returned non-JSON response for "${title}" (${year}): ${html.slice(0, 100)}...`);
      return null;
    }

    const data = await response.json();
    if (data.error || data.Response === "False") {
      failedCache.add(key);
      console.warn(`⚠️ OMDb error: ${data.error || data.Error} for "${title}" (${year})`);
      return null;
    }

    return {
      imdbRating: data.imdbRating,
      Ratings: data.Ratings || [],
    };
  } catch (err) {
    console.error(`❌ OMDb fetch failed for "${title}" (${year}):`, err.message);
    failedCache.add(key);
    return null;
  }
};

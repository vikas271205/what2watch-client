// client/api/omdb.js
const API_BASE = process.env.REACT_APP_API_BASE_URL;

// In-memory cache for failed requests (resets on page refresh)
const failedCache = new Set();

// --- NEW: Configuration for the persistent success cache ---
const SUCCESS_CACHE_KEY = 'omdbSuccessCache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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

  // --- NEW: Check for a fresh, successful result in localStorage ---
  try {
    const cacheStore = JSON.parse(localStorage.getItem(SUCCESS_CACHE_KEY)) || {};
    const cachedItem = cacheStore[key];

    if (cachedItem) {
      const isCacheFresh = (new Date().getTime() - cachedItem.timestamp) < CACHE_TTL;
      if (isCacheFresh) {
        console.log(`✅ Serving OMDb from cache for: ${title} (${year})`);
        return cachedItem.data;
      } else {
        console.log(`⌛️ Stale cache for OMDb: ${title} (${year}). Refetching...`);
      }
    }
  } catch (e) {
    console.error("Could not read from OMDb cache", e);
  }


  try {
    const params = new URLSearchParams({ title });
    if (year) params.append("year", year);

    const response = await fetch(`${API_BASE}/api/omdb?${params}`);
    const contentType = response.headers.get("content-type");

    if (!contentType?.includes("application/json")) {
      failedCache.add(key);
      console.warn(`❌ OMDb returned non-JSON response for "${title}" (${year})`);
      return null;
    }

    const data = await response.json();
    if (data.error || data.Response === "False") {
      failedCache.add(key);
      console.warn(`⚠️ OMDb error: ${data.error || data.Error} for "${title}" (${year})`);
      return null;
    }

    const result = {
      imdbRating: data.imdbRating,
      Ratings: data.Ratings || [],
    };

    // --- NEW: Save the successful result to localStorage with a timestamp ---
    try {
      const cacheStore = JSON.parse(localStorage.getItem(SUCCESS_CACHE_KEY)) || {};
      cacheStore[key] = {
        data: result,
        timestamp: new Date().getTime(),
      };
      localStorage.setItem(SUCCESS_CACHE_KEY, JSON.stringify(cacheStore));
      console.log(`💽 Cached successful OMDb response for: ${title} (${year})`);
    } catch (e) {
      console.error("Could not write to OMDb cache", e);
    }
    
    return result;

  } catch (err) {
    console.error(`❌ OMDb fetch failed for "${title}" (${year}):`, err.message);
    failedCache.add(key);
    return null;
  }
};
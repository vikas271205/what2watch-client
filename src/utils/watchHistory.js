// /src/utils/watchHistory.js

const STORAGE_KEY = "watch_history_v1";
const LIMIT = 10;

// INTERNAL: safely read localStorage
function readHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("watchHistory: read failed", e);
    return [];
  }
}

// INTERNAL: write back to storage
function writeHistory(arr) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error("watchHistory: write failed", e);
  }
}

// Add or update item in history
export function addToWatchHistory(item) {
  console.log("[WATCH HISTORY] addToWatchHistory called with:", item);
  if (!item?.id || !item?.type) {
    console.warn("[WATCH HISTORY] Invalid item, missing id or type:", item);
    return;
  }

  const now = Date.now();
  const history = readHistory();
  console.log("[WATCH HISTORY] Existing history:", history);

  // remove same item if exists
  const filtered = history.filter(
    (x) => !(String(x.id) === String(item.id) && x.type === item.type)
  );

  const record = {
    id: item.id,
    type: item.type, // "movie" or "tv"
    title: item.title || "",
    poster_path: item.poster_path || "",
    progress: item.progress || null,
    timestamp: now,
  };

  filtered.unshift(record);

  // limit items
  const finalArr = filtered.slice(0, LIMIT);
  console.log("[WATCH HISTORY] Final array to store:", finalArr);
  writeHistory(finalArr);
  console.log("[WATCH HISTORY] Stored successfully!");
}

export function getWatchHistory() {
  return readHistory();
}

export function removeFromWatchHistory(id, type) {
  const history = readHistory();
  const filtered = history.filter(
    (x) => !(String(x.id) === String(id) && x.type === type)
  );
  writeHistory(filtered);
}

export function clearWatchHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("watchHistory: clear failed", e);
  }
}

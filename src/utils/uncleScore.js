// utils/uncleScore.js
import API_BASE from "./api";

export async function calculateUncleScore(title, overview, tmdbId, tmdb, imdb, rt, popularity, genres, type = "movie") {
  try {
    // Call our worth-it backend API
    const res = await fetch(`${API_BASE}/api/ai/worth-it`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        overview,
        tmdbId,
        tmdbRating: tmdb,
        imdbRating: imdb,
        popularity,
        genres,
        type
      })
    });

    const data = await res.json();

    if (data?.score) {
      // Convert 0–100 → 0–10 like 9.2
      return {
        score: (data.score / 10).toFixed(1),
        raw: data.score,
        badge: data.badge || null
      };

    }
  } catch (err) {
    console.error("Worth-It score failed, using fallback:", err);
  }

  // ---------- FALLBACK (old uncle score logic) ----------
  const tmdbScore = Number(tmdb) * 10 || 0;
  const imdbScore = Number(imdb) * 10 || 0;
  const rtScore = rt?.endsWith("%") ? Number(rt.replace("%", "")) : Number(rt) || 0;

  const validScores = [tmdbScore, imdbScore, rtScore].filter((n) => n > 0);
  if (validScores.length === 0) {
    return tmdb && Number(tmdb) > 0 ? Number(tmdb).toFixed(1) : null;
  }

  const average = validScores.reduce((a, b) => a + b, 0) / validScores.length;
  return (average / 10).toFixed(1);
}

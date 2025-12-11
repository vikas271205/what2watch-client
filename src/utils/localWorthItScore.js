// src/utils/localWorthItScore.js

// Normalize helper
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// ---------- GENRE BIAS ----------
function genreBias(genres = []) {
  if (!genres || !Array.isArray(genres)) return 0;

  // Normalize: genres may be ["Action"] OR [{id: 28, name: "Action"}]
  const names = genres
    .map(g => {
      if (!g) return null;

      if (typeof g === "string") return g.toLowerCase();
      if (typeof g === "object" && g.name) return g.name.toLowerCase();

      return null;
    })
    .filter(Boolean); // remove nulls

  let b = 0;

  if (names.includes("documentary")) b += 0.4;
  if (names.includes("animation")) b += 0.2;
  if (names.includes("biography")) b += 0.2;

  if (names.includes("romance")) b -= 0.1;
  if (names.includes("action")) b -= 0.2;
  if (names.includes("horror")) b -= 0.25;

  return b;
}


// ---------- FRESHNESS BONUS ----------
function freshnessBonus(year) {
  if (!year) return 0;

  const age = new Date().getFullYear() - Number(year);
  if (age <= 2) return 0.3;       // recent → boost
  if (age >= 20) return -0.1;     // old → slight penalty

  return 0;
}

// ---------- VOTE COUNT STABILITY ----------
function voteStability(voteCount) {
  if (!voteCount || voteCount <= 0) return 0;

  const norm = clamp(Math.log10(voteCount) / 5, 0, 1); // log scale
  return norm * 0.8; // contributes up to +0.8 → meaningful
}

// ---------- POPULARITY (tmdb's pop score) ----------
function popularityBoost(popularity) {
  if (!popularity || popularity <= 0) return 0;
  return clamp(popularity / 100, 0, 1) * 0.6; // small influence
}

// ---------- MAIN HYBRID SCORE ----------
export function computeLocalWorthItScore({
  tmdbRating,
  imdbRating,
  rtRating,
  popularity,
  voteCount,
  genres = [],
  releaseYear
}) {
  // Cleaned numeric values
  const tmdb = Number(tmdbRating);
  const imdb = Number(imdbRating);
  const rt = rtRating ? Number(rtRating.replace("%", "")) / 10 : NaN;

  const components = [];

  // ---------- CORE COMPONENTS (only push if present) ----------
  if (!isNaN(tmdb))     components.push({ value: tmdb, weight: 0.40 });
  if (!isNaN(imdb))     components.push({ value: imdb, weight: 0.35 });
  if (!isNaN(rt))       components.push({ value: rt,   weight: 0.15 });

  // popularity boost
  const popBoost = popularity ? clamp(popularity / 100, 0, 1) * 10 : NaN;
  if (!isNaN(popBoost)) components.push({ value: popBoost, weight: 0.05 });

  // vote stability
  const voteBoost = voteCount ? clamp(Math.log10(voteCount) / 5, 0, 1) * 10 : NaN;
  if (!isNaN(voteBoost)) components.push({ value: voteBoost, weight: 0.05 });

  // ---------- NORMALIZE WEIGHTS ----------
  const weightSum = components.reduce((acc, c) => acc + c.weight, 0);

  // avoid division by 0 (all fields missing → return 0)
  if (weightSum === 0) return 0;

  // apply normalized weights
  let core = components.reduce((acc, c) => {
    const normalizedWeight = c.weight / weightSum;
    return acc + c.value * normalizedWeight;
  }, 0);

  // ---------- GENRE BIAS ----------
  core += genreBias(genres);

  // ---------- FRESHNESS BONUS ----------
  core += freshnessBonus(releaseYear);

  // clamp
  return Number(clamp(core, 0, 10).toFixed(1));
}


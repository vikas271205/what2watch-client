export function calculateUncleScore(tmdb, imdb, rt) {
  const tmdbScore = Number(tmdb) * 10 || 0;
  const imdbScore = Number(imdb) * 10 || 0;
  const rtScore = rt?.endsWith('%') ? Number(rt.replace('%', '')) : 0;

  const validScores = [tmdbScore, imdbScore, rtScore].filter(n => n > 0);
  if (validScores.length === 0) return null;

  const average = validScores.reduce((a, b) => a + b, 0) / validScores.length;
  return Math.round(average) / 10; // 8.4
 // Uncle score is out of 10
}

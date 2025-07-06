const TMDB_API_KEY = "2130c722b019ea8fbd7f0e8aceac0704";

const genreNameToId = {
  action: 28,
  comedy: 35,
  drama: 18,
  romance: 10749,
  horror: 27,
  thriller: 53,
  fantasy: 14,
  animation: 16,
  sciFi: 878,
  documentary: 99
};

const moodToKeyword = {
  happy: "feel-good",
  sad: "emotional",
  adventurous: "adventure",
  romantic: "romance",
  thrilling: "thriller",
  relaxed: "comedy"
};

const durationToRange = {
  short: { lte: 90 },
  medium: { gte: 90, lte: 120 },
  long: { gte: 120 }
};

export const getRecommendedMovies = async ({ mood, genre, language, duration }) => {
  const genreId = genreNameToId[genre];
  const keyword = moodToKeyword[mood];
  const durationRange = durationToRange[duration];

  const params = new URLSearchParams({
    api_key: TMDB_API_KEY,
    sort_by: "popularity.desc",
    with_genres: genreId,
    with_original_language: language
  });

  if (durationRange?.gte) {
    params.append("with_runtime.gte", durationRange.gte);
  }
  if (durationRange?.lte) {
    params.append("with_runtime.lte", durationRange.lte);
  }

  // Try filtering by keyword
  if (keyword) {
    params.append("with_keywords", keyword);
  }

  const res = await fetch(`https://api.themoviedb.org/3/discover/movie?${params.toString()}`);
  const data = await res.json();
  return data.results || [];
};

// -------------------------------------------------------
// REUSABLE UNCLE SCORE ENGINE
// -------------------------------------------------------
//
// Works with partial data (TMDB-only, RT-only, IMDb-only, etc).
// Fully normalizes weights based on available ratings.
// Adds gentle popularity boost.
// Returns: { score: "7.4", badge: "Worth Watching" }
// -------------------------------------------------------

export function computeUncleScore({
    tmdb,       // 0–10
    imdb,       // 0–10
    rt,         // %, string or number
    popularity, // TMDB popularity score
    genres = [] // array of genre names (optional)
}) {
    try {
        // -----------------------------
        // 1. NORMALIZE INPUTS
        // -----------------------------

        const tmdbN = tmdb ? Number(tmdb) * 10 : 0;             // convert → 100 scale
        const imdbN = imdb ? Number(imdb) * 10 : 0;             // convert → 100 scale
        const rtN =
            typeof rt === "string" && rt.includes("%")
                ? Number(rt.replace("%", ""))
                : typeof rt === "number"
                ? rt
                : 0;

        const validSources = [tmdbN, imdbN, rtN].filter(n => n > 0);

        // -----------------------------
        // 2. BASE SCORE
        // -----------------------------

        let baseScore;

        if (validSources.length > 0) {
            baseScore =
                validSources.reduce((a, b) => a + b, 0) / validSources.length;
        } else {
            // Popularity fallback
            const pop = popularity ? Math.min(100, popularity / 2) : 50;
            baseScore = pop;
        }

        // -----------------------------
        // 3. GENRE BIAS (optional)
        // -----------------------------
        const lowerGenres = genres.map(g => g.toLowerCase());

        if (lowerGenres.includes("documentary")) baseScore += 3;
        if (lowerGenres.includes("animation")) baseScore += 2;
        if (lowerGenres.includes("horror")) baseScore -= 3;
        if (lowerGenres.includes("romance")) baseScore += 1;
        if (lowerGenres.includes("action")) baseScore -= 1;

        // -----------------------------
        // 4. POPULARITY BOOST (soft)
        // -----------------------------
        if (popularity > 2000) baseScore += 5;
        else if (popularity > 1000) baseScore += 3;
        else if (popularity > 500) baseScore += 1;

        // -----------------------------
        // 5. CLAMP 0–100
        // -----------------------------
        baseScore = Math.max(0, Math.min(100, baseScore));

        // -----------------------------
        // 6. BADGE
        // -----------------------------
        let badge = "Mixed";

        if (baseScore >= 80) badge = "Must Watch";
        else if (baseScore >= 70) badge = "Worth Watching";
        else if (baseScore >= 50) badge = "Mixed";
        else badge = "Skip";

        // -----------------------------
        // 7. RETURN 0–10 FORMAT
        // -----------------------------
        return {
            raw: baseScore,
            score: (baseScore / 10).toFixed(1),
            badge
        };
    } catch (err) {
        console.error("UncleScoreEngine Error:", err);
        return { score: null, badge: null };
    }
}

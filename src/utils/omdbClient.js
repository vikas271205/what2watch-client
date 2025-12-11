// src/utils/omdbClient.js
import API_BASE from "./api";

let cache = {};

export async function getOMDbRatings(title, year) {
    if (!title) return null;

    // Normalize title (remove :, -, extra spaces)
    const cleanTitle = title.replace(/[:\-]/g, "").trim();

    const key = `${cleanTitle}_${year}`;
    if (cache[key]) return cache[key];

    try {
        const res = await fetch(
            `${API_BASE}/api/omdb?title=${encodeURIComponent(cleanTitle)}&year=${year || ""}`
        );

        const data = await res.json();

        if (!data || data.Response === "False") {
            console.warn("OMDB miss → fallback search", cleanTitle);
            return null;
        }

        cache[key] = data;
        return data;

    } catch (err) {
        console.error("OMDB fetch failed:", err);
        return null;
    }
}

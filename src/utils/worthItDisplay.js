// Frontend-only score formatting + color + badge system

export function formatWorthItScore(raw) {
  if (raw == null || isNaN(raw)) return null;

  const num = parseFloat(raw);

  // Option C — hide ".0"
  return num % 1 === 0 ? num.toString() : num.toFixed(1);
}

export function getWorthItColor(score) {
  if (score == null) return "#9ca3af"; // gray fallback

  if (score >= 8.5) return "#22c55e"; // green
  if (score >= 7) return "#3b82f6";   // blue
  if (score >= 5) return "#eab308";   // yellow
  return "#ef4444";                   // red
}

export function getWorthItBadge(score) {
  if (score == null) return null;

  if (score >= 8.5) return "Must Watch";
  if (score >= 7) return "Worth Watching";
  if (score >= 5) return "Mixed";
  return "Skip";
}

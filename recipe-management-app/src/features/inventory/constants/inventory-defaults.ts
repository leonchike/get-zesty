export const DEFAULT_LOCATION_EMOJI: Record<string, string> = {
  Pantry: "🥫",
  Spices: "🧂",
  Fridge: "❄️",
  Freezer: "🧊",
  Counter: "🍞",
  Other: "📦",
};

export const FALLBACK_LOCATION_NAME = "Other";

export function getLocationEmoji(name: string, fallback?: string | null) {
  return DEFAULT_LOCATION_EMOJI[name] ?? fallback ?? "📦";
}

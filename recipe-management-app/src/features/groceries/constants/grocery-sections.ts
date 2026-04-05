export const SECTION_ORDER = [
  "Fresh Produce",
  "Bakery & Bread",
  "Deli",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Breakfast & Cereal",
  "Condiments & Sauces",
  "Spices",
  "Baking",
  "Pantry",
  "Snacks",
  "Candy",
  "Beverages",
  "Coffee",
  "Alcohol",
  "Frozen",
  "Paper & Cleaning Products",
  "Health & Wellness",
  "Personal Care",
] as const;

export const SECTION_EMOJI_MAP: Record<string, string> = {
  Alcohol: "🍾",
  "Bakery & Bread": "🍞",
  Baking: "🥣",
  Beverages: "🥤",
  "Breakfast & Cereal": "🥣",
  Candy: "🍬",
  Coffee: "☕",
  "Condiments & Sauces": "🧂",
  "Dairy & Eggs": "🥛",
  Deli: "🥪",
  "Fresh Produce": "🥬",
  Frozen: "🧊",
  "Health & Wellness": "💊",
  "Meat & Seafood": "🍗",
  Pantry: "🥫",
  "Paper & Cleaning Products": "🧻",
  "Personal Care": "🧴",
  Snacks: "🍿",
  Spices: "🌶️",
};

export const DEFAULT_SECTION_EMOJI = "🛒";

export function getSectionEmoji(sectionName: string): string {
  return SECTION_EMOJI_MAP[sectionName] || DEFAULT_SECTION_EMOJI;
}

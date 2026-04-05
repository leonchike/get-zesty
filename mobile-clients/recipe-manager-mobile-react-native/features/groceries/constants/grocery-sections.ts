/** Store-walk order: perimeter -> center aisles -> frozen/non-food */
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
  Alcohol: "\u{1F37E}",
  "Bakery & Bread": "\u{1F35E}",
  Baking: "\u{1F963}",
  Beverages: "\u{1F964}",
  "Breakfast & Cereal": "\u{1F963}",
  Candy: "\u{1F36C}",
  Coffee: "\u2615",
  "Condiments & Sauces": "\u{1F9C2}",
  "Dairy & Eggs": "\u{1F95B}",
  Deli: "\u{1F96A}",
  "Fresh Produce": "\u{1F96C}",
  Frozen: "\u{1F9CA}",
  "Health & Wellness": "\u{1F48A}",
  "Meat & Seafood": "\u{1F357}",
  Pantry: "\u{1F96B}",
  "Paper & Cleaning Products": "\u{1F9FB}",
  "Personal Care": "\u{1F9F4}",
  Snacks: "\u{1F37F}",
  Spices: "\u{1F336}\uFE0F",
};

export const DEFAULT_SECTION_EMOJI = "\u{1F6D2}";

export const getSectionEmoji = (sectionName: string): string =>
  SECTION_EMOJI_MAP[sectionName] || DEFAULT_SECTION_EMOJI;

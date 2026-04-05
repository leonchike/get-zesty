/**
 * Capitalizes the first letter of words in a string.
 * @param str The input string to capitalize.
 * @param onlyFirstWord If true, only capitalizes the first word. If false, capitalizes all words.
 * @returns The capitalized string.
 */
export function capitalizeWords(
  str: string,
  onlyFirstWord: boolean = false
): string {
  if (!str) return str;

  const words = str.split(" ");
  const capitalizedWords = words.map((word, index) => {
    if (index === 0 || !onlyFirstWord) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word.toLowerCase();
  });

  return capitalizedWords.join(" ");
}

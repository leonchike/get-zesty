export function splitRecipeStringCommaSemicolon(
  recipeString: string
): string[] {
  // Split the string by newline characters, commas, and semicolons
  const lines = recipeString.split(/[\r\n,;]+/);

  // Filter out empty lines and trim each line
  return lines.map((line) => line.trim()).filter((line) => line.length > 0);
}

export function splitRecipeString(recipeString: string): string[] {
  // Split the string by newline characters
  const lines = recipeString.split(/\r?\n/);

  // Filter out empty lines and trim each line
  return lines.map((line) => line.trim()).filter((line) => line.length > 0);
}

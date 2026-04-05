export function recipeOwnershipType(
  userId: string | undefined,
  recipeCreatorId: string
) {
  if (!userId) {
    return false;
  }
  if (userId === recipeCreatorId) {
    return true;
  }
  return false;
}

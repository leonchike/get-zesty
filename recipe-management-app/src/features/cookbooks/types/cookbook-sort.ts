export type CookbookSortField =
  | "title-asc"
  | "title-desc"
  | "updatedAt-desc"
  | "createdAt-desc"
  | "recipeCount-desc";

export interface FetchCookbooksParams {
  sort?: CookbookSortField;
  search?: string;
}

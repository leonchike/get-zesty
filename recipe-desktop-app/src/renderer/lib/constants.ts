export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  RECIPES_CREATE: '/recipes/create',
  RECIPE: (id: string) => `/recipes/${id}`,
  RECIPE_EDIT: (id: string) => `/recipes/${id}/edit`,
  COOKBOOKS: '/cookbooks',
  COOKBOOK: (id: string) => `/cookbooks/${id}`,
  GROCERIES: '/groceries',
  SETTINGS: '/settings',
  PRIVACY: '/privacy'
} as const

export const QUERY_KEYS = {
  RECIPES: 'recipes',
  RECIPE: 'recipe',
  PINNED_RECIPES: 'pinned-recipes',
  FILTER_OPTIONS: 'filter-options',
  GROCERIES: 'groceries',
  GROCERY_SECTIONS: 'grocery-sections',
  COOKBOOKS: 'cookbooks',
  COOKBOOK_RECIPES: 'cookbook-recipes',
  COOKBOOK_RECIPE: 'cookbook-recipe',
  USER: 'user'
} as const

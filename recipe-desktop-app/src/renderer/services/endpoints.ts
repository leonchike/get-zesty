// All API endpoints consumed by the desktop app
// Mirrors the mobile client endpoints at https://www.getzesty.food

export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/mobile-auth/login',
  REGISTER: '/api/mobile-auth/register',
  GOOGLE_AUTH: '/api/mobile-auth/google',
  SET_PASSWORD: '/api/mobile-auth/set-password',

  // User
  GET_CURRENT_USER: '/api/mobile/user-get-current',
  UPDATE_PROFILE: '/api/mobile/user-profile-update',
  UPDATE_PASSWORD: '/api/mobile/user-password-update',
  DEACTIVATE_ACCOUNT: '/api/mobile/user-deactivate',

  // Recipes
  RECIPE_SEARCH: '/api/mobile/recipe-search',
  RECIPE: '/api/mobile/recipe',
  PINNED_RECIPES: '/api/mobile/pinned-recipes',
  FILTER_OPTIONS: '/api/mobile/search-filter-options',

  // Recipe AI
  SCRAPE_RECIPE: '/api/scrape',
  GENERATE_RECIPE: '/api/gen',
  RECIPE_CHAT: '/api/mobile/recipe-chat',

  // Images
  CLOUDFLARE_UPLOAD_URL: '/api/mobile/cloudflare-upload-url',
  UPLOAD_IMAGE_FROM_URL: '/api/mobile/upload-recipe-image-from-url',
  UNSPLASH_SEARCH: '/api/unsplash-search',

  // Groceries
  GROCERY_LIST: '/api/mobile-groceries',
  GROCERY_UPDATE: '/api/mobile-grocery-update',
  GROCERY_UPDATES_POLL: '/api/mobile-groceries-updates',
  GROCERY_SECTIONS: '/api/grocery-sections',
  ADD_GROCERIES_FROM_RECIPE: '/api/mobile/add-groceries-from-recipe',

  // Cookbooks (mobile JWT-authenticated endpoints)
  COOKBOOKS: '/api/mobile/cookbooks',
  COOKBOOK_RECIPES: '/api/mobile/cookbook-recipes',
  COOKBOOK_SEARCH: '/api/mobile/cookbook-search'
} as const

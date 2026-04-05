//
//  APIRoutes.swift
//  GetZestyApp
//
//  Centralized API route definitions matching the React Native app routes
//

import Foundation

// MARK: - API Routes Structure

struct APIRoutes {
    
    // MARK: - Authentication Routes
    
    struct Auth {
        static let login = "/api/mobile-auth/login"
        static let register = "/api/mobile-auth/register"
        static let googleLogin = "/api/mobile-auth/google"
        static let emailLogin = "/api/mobile-auth/login"
        static let setPassword = "/api/mobile-auth/set-password"
    }
    
    // MARK: - User Routes
    
    struct User {
        static let getCurrentUser = "/api/mobile/user-get-current"
        static let updateProfile = "/api/mobile/user-profile-update"
        static let changePassword = "/api/mobile/user-password-update"
        static let deactivateAccount = "/api/mobile/user-deactivate"
    }
    
    // MARK: - Recipe Routes
    
    struct Recipe {
        static let search = "/api/mobile/recipe-search"
        static let pinnedRecipes = "/api/mobile/pinned-recipes"
        static let searchFilterOptions = "/api/mobile/search-filter-options"
        static let recipe = "/api/mobile/recipe"
        static let scraper = "/api/mobile/recipe-scraper"
        static let aiGenerate = "/api/mobile/recipe-ai-generate"
        static let uploadImageFromURL = "/api/mobile/upload-recipe-image-from-url"
        
        // Helper methods for dynamic routes
        static func recipe(for id: String) -> String {
            return "\(recipe)/\(id)"
        }
    }
    
    // MARK: - Grocery Routes
    
    struct Grocery {
        static let getUserGroceries = "/api/mobile-groceries"
        static let getMobileGroceryUpdates = "/api/mobile-groceries-updates"
        static let getGrocerySections = "/api/grocery-sections"
        static let updateGroceryItem = "/api/mobile-grocery-update"
        static let addGroceriesFromRecipe = "/api/mobile/add-groceries-from-recipe"
    }
    
    // MARK: - Upload Routes
    
    struct Upload {
        static let cloudflareUploadURL = "/api/mobile/cloudflare-upload-url"
    }
}

// MARK: - Route Validation

extension APIRoutes {
    
    /// Validates that a route starts with the expected API prefix
    static func validateRoute(_ route: String) -> Bool {
        return route.hasPrefix("/api/")
    }
    
    /// Returns all available routes for debugging/documentation
    static func getAllRoutes() -> [String: [String]] {
        return [
            "Authentication": [
                Auth.login,
                Auth.register,
                Auth.googleLogin,
                Auth.emailLogin,
                Auth.setPassword
            ],
            "User": [
                User.getCurrentUser,
                User.updateProfile,
                User.changePassword,
                User.deactivateAccount
            ],
            "Recipe": [
                Recipe.search,
                Recipe.pinnedRecipes,
                Recipe.searchFilterOptions,
                Recipe.recipe,
                Recipe.scraper,
                Recipe.aiGenerate,
                Recipe.uploadImageFromURL
            ],
            "Grocery": [
                Grocery.getUserGroceries,
                Grocery.getMobileGroceryUpdates,
                Grocery.getGrocerySections,
                Grocery.updateGroceryItem,
                Grocery.addGroceriesFromRecipe
            ],
            "Upload": [
                Upload.cloudflareUploadURL
            ]
        ]
    }
}
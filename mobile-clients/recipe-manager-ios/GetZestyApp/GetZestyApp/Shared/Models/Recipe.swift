//
//  Recipe.swift
//  GetZestyApp
//
//  Recipe data models matching API structure
//

import Foundation

struct Recipe: Codable, Identifiable, Hashable {
    let id: String
    let userId: String
    var title: String
    var description: String?
    var difficulty: RecipeDifficulty
    var prepTime: Int?
    var cookTime: Int?
    var restTime: Int?
    var totalTime: Int?
    var servings: Int?
    var ingredients: String?
    var instructions: String?
    var equipment: String?
    var utensils: String?
    var nutrition: RecipeNutrition?
    var notes: String?
    var isPublic: Bool
    var cuisineType: String?
    var mealType: String?
    var dietaryRestrictions: [String]
    var tags: [String]
    var sourceUrl: String?
    var imageUrl: String?
    var rating: Double?
    var isMarkedForDeletion: Bool
    var reviewCount: Int
    var favoriteCount: Int
    var seasonality: String?
    let createdAt: Date
    let updatedAt: Date
    var source: RecipeSource
    var parsedIngredients: [ParsedIngredient]?
    var parsedInstructions: [RecipeInstruction]?
    
    // Computed properties
    var formattedPrepTime: String? {
        guard let prepTime = prepTime else { return nil }
        return formatTime(prepTime)
    }
    
    var formattedCookTime: String? {
        guard let cookTime = cookTime else { return nil }
        return formatTime(cookTime)
    }
    
    var formattedTotalTime: String? {
        guard let totalTime = totalTime else { return nil }
        return formatTime(totalTime)
    }
    
    var difficultyDisplayName: String {
        difficulty.displayName
    }
    
    var isUserGenerated: Bool {
        source == .user
    }
    
    var isAIGenerated: Bool {
        source == .genAI
    }
    
    var isScraped: Bool {
        source == .scrape
    }
    
    private func formatTime(_ minutes: Int) -> String {
        if minutes < 60 {
            return "\(minutes) min"
        } else {
            let hours = minutes / 60
            let remainingMinutes = minutes % 60
            if remainingMinutes == 0 {
                return "\(hours) hr"
            } else {
                return "\(hours) hr \(remainingMinutes) min"
            }
        }
    }
    
    // MARK: - Hashable
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Recipe, rhs: Recipe) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Supporting Types
enum RecipeDifficulty: String, CaseIterable, Codable {
    case easy = "EASY"
    case medium = "MEDIUM"
    case hard = "HARD"
    
    var displayName: String {
        switch self {
        case .easy: return "Easy"
        case .medium: return "Medium"
        case .hard: return "Hard"
        }
    }
    
    var systemImage: String {
        switch self {
        case .easy: return "1.circle.fill"
        case .medium: return "2.circle.fill"
        case .hard: return "3.circle.fill"
        }
    }
    
    var color: String {
        switch self {
        case .easy: return "green"
        case .medium: return "orange"
        case .hard: return "red"
        }
    }
}

enum RecipeSource: String, Codable {
    case user = "USER"
    case scrape = "SCRAPE"
    case genAI = "GEN_AI"
    
    var displayName: String {
        switch self {
        case .user: return "My Recipe"
        case .scrape: return "From Web"
        case .genAI: return "AI Generated"
        }
    }
}

struct RecipeNutrition: Codable {
    let calories: Int?
    let protein: Double?
    let carbohydrates: Double?
    let fat: Double?
    let fiber: Double?
    let sugar: Double?
    let sodium: Double?
}

struct ParsedIngredient: Codable, Identifiable {
    let id = UUID()
    let originalText: String
    let quantity: Double?
    let unit: String?
    let ingredient: String
    let extra: String?
    
    private enum CodingKeys: String, CodingKey {
        case originalText = "original_text"
        case quantity
        case unit
        case ingredient
        case extra
    }
    
    var displayText: String {
        var components: [String] = []
        
        if let quantity = quantity, quantity > 0 {
            let formatter = NumberFormatter()
            formatter.maximumFractionDigits = 2
            formatter.minimumFractionDigits = 0
            components.append(formatter.string(from: NSNumber(value: quantity)) ?? "\(quantity)")
        }
        
        if let unit = unit, !unit.isEmpty {
            components.append(unit)
        }
        
        components.append(ingredient)
        
        if let extra = extra, !extra.isEmpty {
            components.append("(\(extra))")
        }
        
        return components.joined(separator: " ")
    }
}

struct RecipeInstruction: Codable, Identifiable {
    let id = UUID()
    let stepNumber: Int
    let instruction: String
    let duration: Int? // in minutes
    let temperature: Int? // in fahrenheit
    
    var hasTimer: Bool {
        duration != nil && duration! > 0
    }
    
    var formattedDuration: String? {
        guard let duration = duration else { return nil }
        if duration < 60 {
            return "\(duration) min"
        } else {
            let hours = duration / 60
            let minutes = duration % 60
            return minutes > 0 ? "\(hours)h \(minutes)m" : "\(hours)h"
        }
    }
}

// MARK: - API Request/Response Models
struct CreateRecipeRequest: Codable {
    let title: String
    let description: String?
    let difficulty: RecipeDifficulty
    let prepTime: Int?
    let cookTime: Int?
    let restTime: Int?
    let servings: Int?
    let ingredients: String?
    let instructions: String?
    let equipment: String?
    let notes: String?
    let isPublic: Bool
    let cuisineType: String?
    let mealType: String?
    let dietaryRestrictions: [String]
    let tags: [String]
    let imageUrl: String?
    let source: RecipeSource
}

struct UpdateRecipeRequest: Codable {
    let title: String?
    let description: String?
    let difficulty: RecipeDifficulty?
    let prepTime: Int?
    let cookTime: Int?
    let restTime: Int?
    let servings: Int?
    let ingredients: String?
    let instructions: String?
    let equipment: String?
    let notes: String?
    let isPublic: Bool?
    let cuisineType: String?
    let mealType: String?
    let dietaryRestrictions: [String]?
    let tags: [String]?
    let imageUrl: String?
}

struct RecipePage: Codable {
    let recipes: [Recipe]
    let nextPage: Int?
    let totalCount: Int
}

struct RecipeFilters: Codable {
    let cuisineTypes: [String]?
    let mealTypes: [String]?
    let difficulty: RecipeDifficulty?
    let maxPrepTime: Int?
    let maxCookTime: Int?
    let dietaryRestrictions: [String]?
    let tags: [String]?
    let source: RecipeSource?
    
    var hasActiveFilters: Bool {
        return cuisineTypes?.isEmpty == false ||
               mealTypes?.isEmpty == false ||
               difficulty != nil ||
               maxPrepTime != nil ||
               maxCookTime != nil ||
               dietaryRestrictions?.isEmpty == false ||
               tags?.isEmpty == false ||
               source != nil
    }
}

struct SearchFiltersResponse: Codable {
    let mealTypes: [String]
    let cuisineTypes: [String]
    let dietaryRestrictions: [String]
    let tags: [String]
}

// MARK: - Recipe Generation
struct AIRecipeRequest: Codable {
    let prompt: String
}

struct RecipeScrapeRequest: Codable {
    let url: String
}

struct PinRecipeRequest: Codable {
    let recipeId: String
}

struct PinnedRecipe: Codable, Identifiable {
    let id: String
    let userId: String
    let recipeId: String
    let pinnedAt: Date
    let recipe: Recipe
}
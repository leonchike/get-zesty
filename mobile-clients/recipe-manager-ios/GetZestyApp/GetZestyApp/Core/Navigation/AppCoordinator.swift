//
//  AppCoordinator.swift
//  GetZestyApp
//
//  Navigation coordinator for the Recipe Manager app
//

import SwiftUI
import Combine

@MainActor
class AppCoordinator: ObservableObject {
    // MARK: - Published Properties
    @Published var selectedTab: AppTab = .recipes
    @Published var navigationPath = NavigationPath()
    @Published var presentedSheet: PresentedSheet?
    @Published var presentedFullScreenCover: PresentedFullScreenCover?
    
    // MARK: - Navigation State
    enum AppTab: Int, CaseIterable {
        case recipes = 0
        case groceries = 1
        
        var title: String {
            switch self {
            case .recipes: return "Recipes"
            case .groceries: return "Groceries"
            }
        }
        
        var systemImage: String {
            switch self {
            case .recipes: return "book.fill"
            case .groceries: return "cart.fill"
            }
        }
    }
    
    enum PresentedSheet: Identifiable {
        case recipeDetail(String)
        case createRecipe
        case editRecipe(String)
        case recipeChat
        case filters
        case settings
        case cookingExperience(String)
        
        var id: String {
            switch self {
            case .recipeDetail(let id): return "recipeDetail-\(id)"
            case .createRecipe: return "createRecipe"
            case .editRecipe(let id): return "editRecipe-\(id)"
            case .recipeChat: return "recipeChat"
            case .filters: return "filters"
            case .settings: return "settings"
            case .cookingExperience(let id): return "cookingExperience-\(id)"
            }
        }
    }
    
    enum PresentedFullScreenCover: Identifiable {
        case authentication
        
        var id: String {
            switch self {
            case .authentication: return "authentication"
            }
        }
    }
    
    // MARK: - Navigation Actions
    func selectTab(_ tab: AppTab) {
        selectedTab = tab
    }
    
    func presentSheet(_ sheet: PresentedSheet) {
        presentedSheet = sheet
    }
    
    func dismissSheet() {
        presentedSheet = nil
    }
    
    func presentFullScreenCover(_ cover: PresentedFullScreenCover) {
        presentedFullScreenCover = cover
    }
    
    func dismissFullScreenCover() {
        presentedFullScreenCover = nil
    }
    
    func navigateTo<T: Hashable>(_ destination: T) {
        navigationPath.append(destination)
    }
    
    func navigateBack() {
        navigationPath.removeLast()
    }
    
    func navigateToRoot() {
        navigationPath.removeLast(navigationPath.count)
    }
    
    // MARK: - Deep Link Handling
    func handleDeepLink(_ url: URL) {
        // Parse deep links and navigate accordingly
        let pathComponents = url.pathComponents
        
        guard pathComponents.count > 1 else { return }
        
        switch pathComponents[1] {
        case "recipe":
            if pathComponents.count > 2 {
                let recipeId = pathComponents[2]
                presentSheet(.recipeDetail(recipeId))
            }
        case "create-recipe":
            presentSheet(.createRecipe)
        case "groceries":
            selectTab(.groceries)
        default:
            break
        }
    }
    
    // MARK: - State Reset
    func reset() {
        selectedTab = .recipes
        navigationPath = NavigationPath()
        presentedSheet = nil
        presentedFullScreenCover = nil
    }
}
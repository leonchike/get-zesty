//
//  ContentView.swift
//  GetZestyApp
//
//  Main app content view with tab navigation
//

import SwiftUI
import CoreData

struct ContentView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @EnvironmentObject private var authManager: AuthenticationManager
    @EnvironmentObject private var networkMonitor: NetworkMonitor
    @StateObject private var appCoordinator = AppCoordinator()
    @State private var isInitializing = true
    
    var body: some View {
        Group {
            if isInitializing {
                // Show loading screen during initial auth check
                ModernSplashView()
                    .transition(.opacity)
            } else if authManager.isAuthenticated {
                MainTabView()
                    .environmentObject(appCoordinator)
                    .environmentObject(authManager)
                    .transition(.opacity)
            } else {
                AuthenticationView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: isInitializing)
        .animation(.easeInOut(duration: 0.3), value: authManager.isAuthenticated)
        .onReceive(NotificationCenter.default.publisher(for: UIApplication.willEnterForegroundNotification)) { _ in
            print("🚀 App: App entering foreground - checking auth status")
            print("🚀 App: Current auth state - isAuthenticated: \(authManager.isAuthenticated)")
            Task {
                await authManager.checkAuthenticationStatus()
            }
        }
        .onAppear {
            print("🚀 App: ContentView appeared - checking auth status")
            print("🚀 App: Current auth state - isAuthenticated: \(authManager.isAuthenticated)")
            print("🚀 App: Current user: \(authManager.currentUser?.email ?? "nil")")
        }
        .onChange(of: authManager.isLoading) { _, isLoading in
            // Hide splash screen when auth check completes
            if !isLoading && isInitializing {
                // Add a small delay to ensure smooth transition
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    withAnimation {
                        isInitializing = false
                    }
                }
            }
        }
        .fullScreenCover(item: $appCoordinator.presentedFullScreenCover) { cover in
            switch cover {
            case .authentication:
                AuthenticationView()
            }
        }
        .sheet(item: $appCoordinator.presentedSheet) { sheet in
            NavigationView {
                switch sheet {
                case .recipeDetail(let recipeId):
                    RecipeDetailView(recipeId: recipeId)
                case .createRecipe:
                    CreateRecipeView()
                case .editRecipe(let recipeId):
                    EditRecipeView(recipeId: recipeId)
                case .recipeChat:
                    RecipeChatView()
                case .filters:
                    RecipeFiltersView()
                case .settings:
                    SettingsView()
                case .cookingExperience(let recipeId):
                    CookingExperienceView(recipeId: recipeId)
                }
            }
        }
    }
}

struct MainTabView: View {
    @EnvironmentObject private var appCoordinator: AppCoordinator
    @EnvironmentObject private var networkMonitor: NetworkMonitor
    
    var body: some View {
        TabView(selection: $appCoordinator.selectedTab) {
            NavigationStack(path: $appCoordinator.navigationPath) {
                RecipesListView()
                    .navigationDestination(for: String.self) { destination in
                        // Handle navigation destinations
                        Text("Navigation to: \(destination)")
                    }
            }
            .tabItem {
                Image(systemName: AppCoordinator.AppTab.recipes.systemImage)
                Text(AppCoordinator.AppTab.recipes.title)
            }
            .tag(AppCoordinator.AppTab.recipes)
            
            NavigationStack {
                GroceryListView()
            }
            .tabItem {
                Image(systemName: AppCoordinator.AppTab.groceries.systemImage)
                Text(AppCoordinator.AppTab.groceries.title)
            }
            .tag(AppCoordinator.AppTab.groceries)
        }
        .overlay(alignment: .bottom) {
            if !networkMonitor.isConnected {
                OfflineBanner()
            }
        }
    }
}

struct OfflineBanner: View {
    var body: some View {
        HStack {
            Image(systemName: "wifi.slash")
                .foregroundColor(.white)
            Text("No Internet Connection")
                .foregroundColor(.white)
                .font(.caption)
            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color.red)
        .animation(.easeInOut(duration: 0.3), value: true)
    }
}

// MARK: - Main Page Views
struct RecipesListView: View {
    var body: some View {
        VStack(spacing: 0) {
            // Main content
            ScrollView {
                VStack(spacing: 16) {
                    Text("Recipe list will be implemented here")
                        .foregroundColor(.secondary)
                        .padding()
                    
                    // Placeholder content
                    ForEach(0..<10, id: \.self) { index in
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.gray.opacity(0.1))
                            .frame(height: 120)
                            .overlay(
                                Text("Recipe \(index + 1)")
                                    .foregroundColor(.secondary)
                            )
                    }
                }
                .padding(.horizontal)
            }
        }
        .navigationBarHidden(true)
        .safeAreaInset(edge: .top) {
            PageHeader(title: "Recipes")
        }
    }
}

struct GroceriesListView: View {
    var body: some View {
        VStack(spacing: 0) {
            // Main content
            ScrollView {
                VStack(spacing: 16) {
                    Text("Grocery list will be implemented here")
                        .foregroundColor(.secondary)
                        .padding()
                    
                    // Placeholder content
                    ForEach(0..<8, id: \.self) { index in
                        HStack {
                            Circle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(width: 20, height: 20)
                            
                            Text("Grocery item \(index + 1)")
                                .foregroundColor(.primaryText)
                            
                            Spacer()
                            
                            Text("2 lbs")
                                .foregroundColor(.secondary)
                                .font(.caption)
                        }
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.gray.opacity(0.05))
                        )
                    }
                }
                .padding(.horizontal)
            }
        }
        .navigationBarHidden(true)
        .safeAreaInset(edge: .top) {
            PageHeader(title: "Groceries")
        }
    }
}

// AuthenticationView is now in Features/Authentication/Views/

struct RecipeDetailView: View {
    let recipeId: String
    
    var body: some View {
        Text("Recipe Detail: \(recipeId)")
    }
}

struct CreateRecipeView: View {
    var body: some View {
        Text("Create Recipe")
    }
}

struct EditRecipeView: View {
    let recipeId: String
    
    var body: some View {
        Text("Edit Recipe: \(recipeId)")
    }
}

struct RecipeChatView: View {
    var body: some View {
        Text("Recipe Chat")
    }
}

struct RecipeFiltersView: View {
    var body: some View {
        Text("Recipe Filters")
    }
}

struct SettingsPlaceholderView: View {
    var body: some View {
        Text("Settings Placeholder")
    }
}

struct CookingExperienceView: View {
    let recipeId: String
    
    var body: some View {
        Text("Cooking Experience: \(recipeId)")
    }
}

#Preview("ContentView") {
    ContentView()
        .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
        .environmentObject(AuthenticationManager())
        .environmentObject(NetworkMonitor())
}

#Preview("Recipes Page - In App Context") {
    // Wrap in TabView to match real app
    TabView {
        NavigationStack {
            RecipesListView()
        }
        .tabItem {
            Image(systemName: "fork.knife")
            Text("Recipes")
        }
    }
    .environmentObject(AuthenticationManager())
    .environmentObject(AppCoordinator())
}

#Preview("Groceries Page - In App Context") {
    // Wrap in TabView to match real app
    TabView {
        NavigationStack {
            GroceriesListView()
        }
        .tabItem {
            Image(systemName: "cart")
            Text("Groceries")
        }
    }
    .environmentObject(AuthenticationManager())
    .environmentObject(AppCoordinator())
}

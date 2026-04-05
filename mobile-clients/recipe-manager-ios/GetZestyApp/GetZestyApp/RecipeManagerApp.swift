//
//  RecipeManagerApp.swift
//  GetZestyApp
//
//  Created by Recipe Manager Team
//

import SwiftUI
import CoreData

@main
struct RecipeManagerApp: App {
    // MARK: - Core Data Stack
    let persistenceController = PersistenceController.shared
    
    // MARK: - App State
    @StateObject private var authenticationManager = AuthenticationManager()
    @StateObject private var networkMonitor = NetworkMonitor()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
                .environmentObject(authenticationManager)
                .environmentObject(networkMonitor)
                .onAppear {
                    configureApp()
                }
        }
    }
    
    // MARK: - App Configuration
    private func configureApp() {
        print("🚀 App: Starting app configuration at \(Date())")
        
        // Configure appearance
        configureAppearance()
        
        // Start network monitoring
        Task { @MainActor in
            networkMonitor.startMonitoring()
        }
        
        // Check authentication status
        print("🚀 App: About to check authentication status")
        print("🚀 App: Keychain has token: \(authenticationManager.hasStoredToken())")
        Task {
            await authenticationManager.checkAuthenticationStatus()
        }
        
        // Start token check timer
        authenticationManager.startTokenCheckTimer()
        
        print("🚀 App: App configuration completed")
    }
    
    private func configureAppearance() {
        // Configure navigation bar appearance
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor.systemBackground
        appearance.titleTextAttributes = [.foregroundColor: UIColor.label]
        
        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().compactAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance
        
        // Configure tab bar appearance
        let tabBarAppearance = UITabBarAppearance()
        tabBarAppearance.configureWithOpaqueBackground()
        tabBarAppearance.backgroundColor = UIColor.systemBackground
        
        UITabBar.appearance().standardAppearance = tabBarAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabBarAppearance
    }
}
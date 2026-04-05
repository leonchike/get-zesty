//
//  PreviewHelpers.swift
//  GetZestyApp
//
//  Helper utilities for SwiftUI previews
//

import SwiftUI

// MARK: - Mock Data for Previews
extension AuthenticationManager {
    static var preview: AuthenticationManager {
        let manager = AuthenticationManager()
        manager.isAuthenticated = true
        manager.currentUser = User(
            id: "preview-user",
            name: "Preview User",
            firstName: "Preview",
            lastName: "User",
            email: "preview@example.com",
            emailVerified: nil,
            image: nil,
            createdAt: Date(),
            updatedAt: Date(),
            isAccountDisabled: false
        )
        return manager
    }
}

extension AppCoordinator {
    static var preview: AppCoordinator {
        AppCoordinator()
    }
}

extension NetworkMonitor {
    @MainActor
    static var preview: NetworkMonitor {
        let monitor = NetworkMonitor()
        // isConnected defaults to true, so no need to set it
        return monitor
    }
}

// MARK: - Preview Device Presets
struct PreviewDevices {
    static let iPhone15Pro = "iPhone 15 Pro"
    static let iPhone15ProMax = "iPhone 15 Pro Max"
    static let iPhone14 = "iPhone 14"
    static let iPhoneSE = "iPhone SE (3rd generation)"
}

// MARK: - Preview Wrapper for Common Setup
struct PreviewWrapper<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .environmentObject(AuthenticationManager.preview)
            .environmentObject(AppCoordinator.preview)
            .environmentObject(NetworkMonitor.preview)
    }
}
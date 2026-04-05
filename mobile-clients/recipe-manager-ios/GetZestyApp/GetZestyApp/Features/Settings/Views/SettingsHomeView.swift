//
//  SettingsHomeView.swift
//  GetZestyApp
//
//  Settings main screen with user name and navigation options
//

import SwiftUI

struct SettingsHomeView: View {
    @EnvironmentObject private var authManager: AuthenticationManager
    @ObservedObject var viewModel: SettingsViewModel
    
    var body: some View {
        SettingsContainer {
            VStack(spacing: AppSpacing.xl) {
                // Header
                SettingsHeader(title: "Settings")
                
                // User Name Display
                VStack(spacing: AppSpacing.md) {
                    Text(authManager.currentUser?.name ?? "Hello")
                        .font(AppTypography.large(.semibold))
                        .foregroundColor(.primaryText)
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, AppSpacing.lg)
                
                // Settings Options
                VStack(spacing: AppSpacing.xl) {
                    SettingsButton(
                        title: "Profile",
                        description: "Edit your profile information",
                        iconName: "pencil"
                    ) {
                        viewModel.navigateTo(.profile)
                    }
                    
                    SettingsButton(
                        title: "Security",
                        description: "Change your password",
                        iconName: "lock"
                    ) {
                        viewModel.navigateTo(.security)
                    }
                    
                    SettingsButton(
                        title: "Delete",
                        description: "Delete your account",
                        iconName: "minus.circle"
                    ) {
                        viewModel.navigateTo(.deactivate)
                    }
                }
                
                // Logout Section
                VStack(spacing: AppSpacing.lg) {
                    Divider()
                        .padding(.horizontal, AppSpacing.lg)
                    
                    LogoutButton {
                        Task {
                            await authManager.signOut()
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Preview

#Preview {
    SettingsHomeView(viewModel: SettingsViewModel(
        authManager: AuthenticationManager(),
        apiClient: APIClient()
    ))
    .environmentObject(AuthenticationManager())
}

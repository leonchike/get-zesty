//
//  SettingsView.swift
//  GetZestyApp
//
//  Main Settings navigation container that handles state-based navigation
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var authManager: AuthenticationManager
    @StateObject private var viewModel: SettingsViewModel
    
    init() {
        // Initialize with placeholder - will update with real values in onAppear
        self._viewModel = StateObject(wrappedValue: SettingsViewModel(
            authManager: AuthenticationManager(),
            apiClient: APIClient.shared
        ))
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                Color.backgroundPrimary
                    .ignoresSafeArea()
                
                // Content with smooth transitions
                Group {
                    switch viewModel.currentState {
                    case .home:
                        SettingsHomeView(viewModel: viewModel)
                            .transition(slideTransition(for: viewModel.animationDirection))
                    case .profile:
                        SettingsProfileView(viewModel: viewModel)
                            .transition(slideTransition(for: viewModel.animationDirection))
                    case .security:
                        SettingsSecurityView(viewModel: viewModel)
                            .transition(slideTransition(for: viewModel.animationDirection))
                    case .deactivate:
                        SettingsDeactivateView(viewModel: viewModel)
                            .transition(slideTransition(for: viewModel.animationDirection))
                    }
                }
                .animation(.spring(response: 0.4, dampingFraction: 0.8, blendDuration: 0.2), value: viewModel.currentState)
            }
        }
        .onAppear {
            updateViewModelDependencies()
        }
    }
    
    // MARK: - Animation Helpers
    
    private func slideTransition(for direction: SettingsAnimationDirection) -> AnyTransition {
        switch direction {
        case .forward:
            return AnyTransition.asymmetric(
                insertion: .move(edge: .trailing).combined(with: .opacity),
                removal: .move(edge: .leading).combined(with: .opacity)
            )
        case .backward:
            return AnyTransition.asymmetric(
                insertion: .move(edge: .leading).combined(with: .opacity),
                removal: .move(edge: .trailing).combined(with: .opacity)
            )
        case .none:
            return AnyTransition.opacity
        }
    }
    
    // MARK: - Private Methods
    
    private func updateViewModelDependencies() {
        // Sync the viewModel with the current auth manager from environment
        viewModel.syncWithAuthManager(authManager)
    }
}

// MARK: - Preview

#Preview {
    let authManager = AuthenticationManager()
    let apiClient = APIClient()
    return SettingsView()
        .environmentObject(authManager)
}
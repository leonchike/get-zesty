//
//  SettingsDeactivateView.swift
//  GetZestyApp
//
//  Account deletion screen with two-step confirmation
//

import SwiftUI

struct SettingsDeactivateView: View {
    @ObservedObject var viewModel: SettingsViewModel
    @State private var confirmationPassword = ""
    @State private var showPasswordConfirmation = false
    @FocusState private var isPasswordFocused: Bool
    
    var body: some View {
        SettingsContainer {
            VStack(spacing: AppSpacing.xl) {
                // Header with back button
                SettingsHeader(
                    title: "Delete",
                    showBackButton: true,
                    onBack: {
                        viewModel.navigateBack()
                    }
                )
                
                if !showPasswordConfirmation {
                    // Initial deletion warning
                    initialWarningView
                } else {
                    // Password confirmation step
                    passwordConfirmationView
                }
                
                Spacer()
            }
        }
    }
    
    // MARK: - Initial Warning View
    
    private var initialWarningView: some View {
        VStack(spacing: AppSpacing.xl) {
            // Warning Content
            VStack(spacing: AppSpacing.lg) {
                // Warning Icon
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.warning)
                    .padding(.bottom, AppSpacing.sm)
                
                // Warning Text
                VStack(spacing: AppSpacing.md) {
                    Text("Delete Account")
                        .font(AppTypography.large(.bold))
                        .foregroundColor(.primaryText)
                    
                    Text("This action is permanent and cannot be undone. All your recipes, grocery lists, and account data will be permanently deleted.")
                        .font(AppTypography.body(.medium))
                        .foregroundColor(.secondaryText)
                        .multilineTextAlignment(.center)
                        .lineSpacing(4)
                }
                
                // Support Information
                VStack(spacing: AppSpacing.sm) {
                    Text("If you're having trouble with the app, please contact our support team:")
                        .font(AppTypography.callout(.medium))
                        .foregroundColor(.tertiaryText)
                        .multilineTextAlignment(.center)
                    
                    Button("support@getzesty.food") {
                        if let url = URL(string: "mailto:support@getzesty.food") {
                            UIApplication.shared.open(url)
                        }
                    }
                    .font(AppTypography.callout(.semibold))
                    .foregroundColor(.brandPrimary)
                }
            }
            .padding(.horizontal, AppSpacing.lg)
            
            // Action Buttons
            VStack(spacing: AppSpacing.md) {
                CustomButton.danger(
                    "Delete Account",
                    action: {
                        showPasswordConfirmation = true
                    }
                )
                
                CustomButton.tertiary(
                    "Cancel",
                    action: {
                        viewModel.navigateBack()
                    }
                )
            }
            .padding(.horizontal, AppSpacing.lg)
        }
    }
    
    // MARK: - Password Confirmation View
    
    private var passwordConfirmationView: some View {
        VStack(spacing: AppSpacing.xl) {
            // Confirmation Content
            VStack(spacing: AppSpacing.lg) {
                // Final Warning
                VStack(spacing: AppSpacing.md) {
                    Text("Final Confirmation")
                        .font(AppTypography.large(.bold))
                        .foregroundColor(.primaryText)
                    
                    Text("Please enter your password to permanently delete your account. This action cannot be undone.")
                        .font(AppTypography.body(.medium))
                        .foregroundColor(.secondaryText)
                        .multilineTextAlignment(.center)
                        .lineSpacing(4)
                }
                
                // Password Field
                VStack(spacing: AppSpacing.md) {
                    InputField.password(
                        title: "Current Password",
                        text: Binding(
                            get: { confirmationPassword },
                            set: { newValue in
                                confirmationPassword = newValue
                                viewModel.handleFieldChange()
                            }
                        )
                    )
                    .focused($isPasswordFocused)
                    .submitLabel(.done)
                    .onSubmit {
                        handleDeleteAccount()
                    }
                }
                .padding(.horizontal, AppSpacing.lg)
            }
            
            // Error/Success Messages
            VStack(spacing: AppSpacing.sm) {
                if let errorMessage = viewModel.errorMessage {
                    SettingsMessageView(message: errorMessage, isError: true)
                        .padding(.horizontal, AppSpacing.lg)
                }
                
                if let successMessage = viewModel.successMessage {
                    SettingsMessageView(message: successMessage, isError: false)
                        .padding(.horizontal, AppSpacing.lg)
                }
            }
            
            // Action Buttons
            VStack(spacing: AppSpacing.md) {
                CustomButton.danger(
                    viewModel.isLoading ? "Deleting Account..." : "Delete Account Forever",
                    action: handleDeleteAccount,
                    isLoading: viewModel.isLoading,
                    isDisabled: confirmationPassword.isEmpty
                )
                
                CustomButton.tertiary(
                    "Cancel",
                    action: {
                        showPasswordConfirmation = false
                        confirmationPassword = ""
                    },
                    isDisabled: viewModel.isLoading
                )
            }
            .padding(.horizontal, AppSpacing.lg)
        }
        .onAppear {
            // Focus password field when confirmation appears
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                isPasswordFocused = true
            }
        }
    }
    
    // MARK: - Actions
    
    private func handleDeleteAccount() {
        isPasswordFocused = false
        Task {
            await viewModel.deleteAccount(password: confirmationPassword)
        }
    }
}

// MARK: - Preview

#Preview {
    SettingsDeactivateView(viewModel: SettingsViewModel(
        authManager: AuthenticationManager(),
        apiClient: APIClient()
    ))
}

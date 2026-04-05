//
//  SettingsSecurityView.swift
//  GetZestyApp
//
//  Security screen for password management with validation
//

import SwiftUI

struct SettingsSecurityView: View {
    @ObservedObject var viewModel: SettingsViewModel
    @FocusState private var focusedField: Field?
    
    enum Field {
        case currentPassword, newPassword, confirmPassword
    }
    
    var body: some View {
        SettingsContainer {
            VStack(spacing: AppSpacing.xl) {
                // Header with back button
                SettingsHeader(
                    title: "Security",
                    showBackButton: true,
                    onBack: {
                        viewModel.navigateBack()
                    }
                )
                
                // Info Text
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text("Security is a top priority for us. Please enter your current password and a secure new password you want to set.")
                        .font(AppTypography.body(.regular))
                        .foregroundColor(.secondaryText)
                        .multilineTextAlignment(.leading)
                }
                .padding(.horizontal, AppSpacing.lg)
                
                // Form Section
                VStack(spacing: AppSpacing.lg) {
                    // Current Password Field
                    InputField.password(
                        title: "Current Password",
                        text: Binding(
                            get: { viewModel.currentPassword },
                            set: { newValue in
                                viewModel.currentPassword = newValue
                                viewModel.handleFieldChange()
                            }
                        )
                    )
                    .focused($focusedField, equals: .currentPassword)
                    .submitLabel(.next)
                    .onSubmit {
                        focusedField = .newPassword
                    }
                    
                    // New Password Field
                    InputField.password(
                        title: "New Password",
                        text: Binding(
                            get: { viewModel.newPassword },
                            set: { newValue in
                                viewModel.newPassword = newValue
                                viewModel.handleFieldChange()
                            }
                        )
                    )
                    .focused($focusedField, equals: .newPassword)
                    .submitLabel(.next)
                    .onSubmit {
                        focusedField = .confirmPassword
                    }
                    
                    // Confirm Password Field
                    InputField.password(
                        title: "Confirm New Password",
                        text: Binding(
                            get: { viewModel.confirmPassword },
                            set: { newValue in
                                viewModel.confirmPassword = newValue
                                viewModel.handleFieldChange()
                            }
                        )
                    )
                    .focused($focusedField, equals: .confirmPassword)
                    .submitLabel(.done)
                    .onSubmit {
                        focusedField = nil
                        Task {
                            await viewModel.updatePassword()
                        }
                    }
                    
                    // Update Password Button
                    CustomButton.primary(
                        viewModel.isLoading ? "Updating..." : "Update Password",
                        action: {
                            focusedField = nil
                            Task {
                                await viewModel.updatePassword()
                            }
                        },
                        size:.medium,
                        isLoading: viewModel.isLoading,
                        isDisabled: isFormIncomplete
                    )
                    
                    // Error/Success Messages
                    if let errorMessage = viewModel.errorMessage {
                        SettingsMessageView(message: errorMessage, isError: true)
                    }
                    
                    if let successMessage = viewModel.successMessage {
                        SettingsMessageView(message: successMessage, isError: false)
                    }
                }
                .padding(.horizontal, AppSpacing.lg)
                
                Spacer()
            }
        }
        .onAppear {
            // Focus the current password field when view appears
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                focusedField = .currentPassword
            }
        }
    }
    
    // MARK: - Computed Properties
    
    private var isFormIncomplete: Bool {
        viewModel.currentPassword.isEmpty ||
        viewModel.newPassword.isEmpty ||
        viewModel.confirmPassword.isEmpty
    }
}

// MARK: - Preview

#Preview {
    SettingsSecurityView(viewModel: SettingsViewModel(
        authManager: AuthenticationManager(),
        apiClient: APIClient()
    ))
}

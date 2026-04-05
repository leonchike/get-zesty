//
//  SettingsProfileView.swift
//  GetZestyApp
//
//  Profile editing screen with name field and update functionality
//

import SwiftUI

struct SettingsProfileView: View {
    @ObservedObject var viewModel: SettingsViewModel
    @FocusState private var isNameFocused: Bool
    
    var body: some View {
        SettingsContainer {
            VStack(spacing: AppSpacing.xl) {
                // Header with back button
                SettingsHeader(
                    title: "Profile",
                    showBackButton: true,
                    onBack: {
                        viewModel.navigateBack()
                    }
                )
                
                // Form Section
                VStack(spacing: AppSpacing.lg) {
                    // Name Field
                    InputField.text(
                        title: "Name",
                        placeholder: "Enter your name",
                        text: Binding(
                            get: { viewModel.editedName },
                            set: { newValue in
                                viewModel.editedName = newValue
                                viewModel.handleFieldChange()
                            }
                        )
                    )
                    .focused($isNameFocused)
                    .submitLabel(.done)
                    .onSubmit {
                        Task {
                            await viewModel.updateProfile()
                        }
                    }
                    
                    // Update Button
                    CustomButton.primary(
                        viewModel.isLoading ? "Updating..." : "Update",
                        action: {
                            isNameFocused = false
                            Task {
                                await viewModel.updateProfile()
                            }
                        },
                        size:.medium,
                        isLoading: viewModel.isLoading,
                        isDisabled: viewModel.editedName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
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
            // Focus the name field when view appears
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                isNameFocused = true
            }
        }
    }
}

// MARK: - Preview

#Preview {
    SettingsProfileView(viewModel: SettingsViewModel(
        authManager: AuthenticationManager(),
        apiClient: APIClient()
    ))
}

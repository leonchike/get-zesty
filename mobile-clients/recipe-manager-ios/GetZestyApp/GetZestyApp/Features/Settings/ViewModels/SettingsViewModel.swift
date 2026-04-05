//
//  SettingsViewModel.swift
//  GetZestyApp
//
//  Settings business logic and state management
//

import SwiftUI
import Combine

@MainActor
class SettingsViewModel: ObservableObject {
    @Published var currentState: SettingsNavigationState = .home
    @Published var previousState: SettingsNavigationState = .home
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var successMessage: String?
    
    // Profile editing state
    @Published var editedName = ""
    
    // Security state
    @Published var currentPassword = ""
    @Published var newPassword = ""
    @Published var confirmPassword = ""
    
    // Dependencies
    private var authManager: AuthenticationManager
    private let apiClient: APIClient
    private var cancellables = Set<AnyCancellable>()
    
    init(authManager: AuthenticationManager, apiClient: APIClient) {
        self.authManager = authManager
        self.apiClient = apiClient
        
        // Initialize with user's current name
        self.editedName = authManager.currentUser?.name ?? ""
        
        // Listen to user changes
        authManager.$currentUser
            .compactMap { $0?.name }
            .assign(to: \.editedName, on: self)
            .store(in: &cancellables)
    }
    
    // MARK: - Navigation
    
    func navigateTo(_ state: SettingsNavigationState) {
        previousState = currentState
        currentState = state
        clearMessages()
    }
    
    func navigateBack() {
        previousState = currentState
        currentState = .home
        clearMessages()
    }
    
    var animationDirection: SettingsAnimationDirection {
        currentState.animationDirection(from: previousState)
    }
    
    // MARK: - Public Methods
    
    func syncWithAuthManager(_ authManager: AuthenticationManager) {
        // Update the reference to the real AuthenticationManager
        self.authManager = authManager
        
        // Update the edited name with current user data
        editedName = authManager.currentUser?.name ?? ""
        
        // Re-establish the reactive listener with the new auth manager
        cancellables.removeAll()
        authManager.$currentUser
            .compactMap { $0?.name }
            .assign(to: \.editedName, on: self)
            .store(in: &cancellables)
    }
    
    // MARK: - Profile Management
    
    func updateProfile() async {
        guard !editedName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Name cannot be empty"
            return
        }
        
        isLoading = true
        clearMessages()
        
        do {
            let success = await authManager.updateUserProfile(name: editedName)
            
            if success {
                successMessage = "Profile updated successfully"
            } else {
                errorMessage = "Failed to update profile"
            }
        } catch {
            errorMessage = "Something went wrong"
        }
        
        isLoading = false
    }
    
    // MARK: - Security Management
    
    func updatePassword() async {
        // Validate passwords
        guard validatePasswords() else { return }
        
        isLoading = true
        clearMessages()
        
        do {
            let success = await authManager.changePassword(
                currentPassword: currentPassword,
                newPassword: newPassword
            )
            
            if success {
                successMessage = "Password updated successfully"
                clearPasswordFields()
            } else {
                errorMessage = "Failed to update password. Please check your current password."
            }
        } catch {
            errorMessage = "Something went wrong"
        }
        
        isLoading = false
    }
    
    private func validatePasswords() -> Bool {
        if newPassword.count < 6 {
            errorMessage = "New password must be at least 6 characters long"
            return false
        }
        
        // Check for special character
        let specialCharRegex = #"[^A-Za-z0-9]"#
        if newPassword.range(of: specialCharRegex, options: .regularExpression, range: nil, locale: nil) == nil {
            errorMessage = "New password must include at least one special character"
            return false
        }
        
        if newPassword != confirmPassword {
            errorMessage = "New password and confirmation do not match"
            return false
        }
        
        return true
    }
    
    private func clearPasswordFields() {
        currentPassword = ""
        newPassword = ""
        confirmPassword = ""
    }
    
    // MARK: - Account Deletion
    
    func deleteAccount(password: String) async {
        isLoading = true
        clearMessages()
        
        do {
            let success = await authManager.deleteAccount(password: password)
            
            if success {
                // Account deleted successfully - AuthManager will handle logout
                successMessage = "Account deleted successfully"
            } else {
                errorMessage = "Failed to delete account. Please check your password."
            }
        } catch {
            errorMessage = "Something went wrong"
        }
        
        isLoading = false
    }
    
    // MARK: - Helpers
    
    private func clearMessages() {
        errorMessage = nil
        successMessage = nil
    }
    
    func handleFieldChange() {
        clearMessages()
    }
}
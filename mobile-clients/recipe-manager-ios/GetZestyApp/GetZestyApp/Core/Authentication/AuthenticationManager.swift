//
//  AuthenticationManager.swift
//  GetZestyApp
//
//  Manages user authentication and session state
//

import Foundation
import Combine

@MainActor
class AuthenticationManager: ObservableObject {
    // MARK: - Published Properties
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var currentUser: User?
    @Published var authError: AuthError?
    
    // MARK: - Private Properties
    private let apiClient = APIClient.shared
    private let keychainManager = KeychainManager.shared
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    init() {
        // Initialize authentication manager
        // Start with loading true to show splash screen
        isLoading = true
    }
    
    // MARK: - Public Methods
    func hasStoredToken() -> Bool {
        return keychainManager.getAuthToken() != nil
    }
    
    func checkAuthenticationStatus() async {
        print("🔐 AuthManager: Checking authentication status on app startup")
        isLoading = true
        
        // Check if we have a valid token
        guard let token = keychainManager.getAuthToken() else {
            print("🔐 AuthManager: No token found, user needs to login")
            // Don't call signOut here, just update state
            isAuthenticated = false
            currentUser = nil
            isLoading = false
            return
        }
        
        print("🔐 AuthManager: Found existing token, checking if expired")
        
        // Check if token is expired
        if isTokenExpired(token) {
            print("🔐 AuthManager: Token is expired, signing out")
            await signOut()
            isLoading = false
            return
        }
        
        print("🔐 AuthManager: Token is valid, fetching user info")
        
        // Verify token with backend and get user info
        do {
            let user = try await fetchCurrentUser()
            currentUser = user
            isAuthenticated = true
            print("✅ AuthManager: User authenticated successfully: \(user.email)")
        } catch {
            print("❌ AuthManager: Failed to fetch user, signing out")
            await signOut()
        }
        
        isLoading = false
        print("🔐 AuthManager: Authentication check completed. isAuthenticated: \(isAuthenticated)")
    }
    
    func signInWithEmail(_ email: String, password: String) async {
        print("🔐 AuthManager: Starting login for email: \(email)")
        isLoading = true
        authError = nil
        
        do {
            print("🌐 AuthManager: Making login request to \(APIRoutes.Auth.emailLogin)")
            let response = try await apiClient.request(
                endpoint: APIEndpoint(
                    path: APIRoutes.Auth.emailLogin,
                    method: .POST,
                    body: EmailLoginRequest(email: email, password: password)
                ),
                responseType: AuthResponse.self
            )
            
            print("✅ AuthManager: Login successful for user: \(response.user.email)")
            await handleSuccessfulAuth(response)
            
        } catch {
            print("❌ AuthManager: Login failed with error: \(error)")
            if let apiError = error as? APIError {
                print("❌ AuthManager: API Error details: \(apiError.localizedDescription)")
            }
            handleAuthError(error)
        }
        
        isLoading = false
    }
    
    func signUpWithEmail(_ email: String, password: String, name: String) async {
        print("🔐 AuthManager: Starting registration for email: \(email), name: \(name)")
        isLoading = true
        authError = nil
        
        do {
            print("🌐 AuthManager: Making registration request to \(APIRoutes.Auth.register)")
            let response = try await apiClient.request(
                endpoint: APIEndpoint(
                    path: APIRoutes.Auth.register,
                    method: .POST,
                    body: EmailRegisterRequest(email: email, password: password, name: name)
                ),
                responseType: AuthResponse.self
            )
            
            print("✅ AuthManager: Registration successful for user: \(response.user.email)")
            await handleSuccessfulAuth(response)
            
        } catch {
            print("❌ AuthManager: Registration failed with error: \(error)")
            if let apiError = error as? APIError {
                print("❌ AuthManager: API Error details: \(apiError.localizedDescription)")
            }
            handleAuthError(error)
        }
        
        isLoading = false
    }
    
    // Google Sign-In will be implemented in Phase 4
    // func signInWithGoogle() async { ... }
    
    func signOut() async {
        print("🔐 AuthManager: Signing out user")
        // Clear keychain
        keychainManager.clearAllData()
        
        // Update state
        isAuthenticated = false
        currentUser = nil
        authError = nil
        print("🔐 AuthManager: User signed out, keychain cleared")
    }
    
    func resetPassword(_ email: String) async {
        isLoading = true
        authError = nil
        
        do {
            _ = try await apiClient.request(
                endpoint: APIEndpoint(
                    path: APIRoutes.Auth.setPassword,
                    method: .POST,
                    body: ResetPasswordRequest(email: email)
                ),
                responseType: EmptyResponse.self
            )
            
            // Show success message
            authError = .passwordResetSent
            
        } catch {
            handleAuthError(error)
        }
        
        isLoading = false
    }
    
    // MARK: - Private Methods
    
    private func handleSuccessfulAuth(_ response: AuthResponse) async {
        // Save tokens
        keychainManager.saveAuthToken(response.token)
        keychainManager.saveUserEmail(response.user.email)
        keychainManager.saveUserId(response.user.id)
        
        // Update state
        currentUser = response.user
        isAuthenticated = true
        authError = nil
    }
    
    private func handleAuthError(_ error: Error) {
        if let apiError = error as? APIError {
            switch apiError {
            case .serverError(let statusCode, let message):
                if statusCode == 401 {
                    authError = .invalidCredentials
                } else if statusCode == 404 {
                    authError = .userNotFound
                } else {
                    authError = .serverError(message)
                }
            case .networkError:
                authError = .networkError
            default:
                authError = .unknownError
            }
        } else {
            authError = .unknownError
        }
    }
    
    private func fetchCurrentUser() async throws -> User {
        print("🔐 AuthManager: Fetching current user from \(APIRoutes.User.getCurrentUser)")
        do {
            let user = try await apiClient.request(
                endpoint: APIEndpoint(path: APIRoutes.User.getCurrentUser),
                responseType: User.self
            )
            print("✅ AuthManager: Successfully fetched user: \(user.email)")
            return user
        } catch {
            print("❌ AuthManager: Failed to fetch current user: \(error)")
            throw error
        }
    }
    
    // MARK: - Token Management
    private func isTokenExpired(_ token: String) -> Bool {
        guard let expirationTime = getTokenExpirationTime(token) else {
            return true // If we can't parse, assume it's expired
        }
        
        let expirationDate = Date(timeIntervalSince1970: expirationTime)
        return expirationDate < Date()
    }
    
    private func getTokenExpirationTime(_ token: String) -> TimeInterval? {
        let segments = token.components(separatedBy: ".")
        guard segments.count == 3 else { return nil }
        
        let payloadSegment = segments[1]
        
        // Add padding if needed for base64 decoding
        var padded = payloadSegment
        let remainder = padded.count % 4
        if remainder > 0 {
            padded += String(repeating: "=", count: 4 - remainder)
        }
        
        guard let data = Data(base64Encoded: padded),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let exp = json["exp"] as? TimeInterval else {
            return nil
        }
        
        return exp
    }
    
    
    // MARK: - Profile Management
    
    func updateUserProfile(name: String) async -> Bool {
        do {
            struct UpdateProfileRequest: Codable {
                let data: PartialUser
                
                struct PartialUser: Codable {
                    let name: String?
                    
                    init(name: String) {
                        self.name = name
                    }
                }
            }
            
            let updatedUser = try await apiClient.request(
                endpoint: APIEndpoint(
                    path: APIRoutes.User.updateProfile,
                    method: .PATCH,
                    body: UpdateProfileRequest(data: UpdateProfileRequest.PartialUser(name: name))
                ),
                responseType: User.self
            )
            
            await MainActor.run {
                self.currentUser = updatedUser
            }
            
            print("✅ AuthManager: Successfully updated user profile")
            return true
        } catch {
            print("❌ AuthManager: Failed to update profile: \(error)")
            return false
        }
    }
    
    func changePassword(currentPassword: String, newPassword: String) async -> Bool {
        do {
            struct ChangePasswordRequest: Codable {
                let data: PasswordData
                
                struct PasswordData: Codable {
                    let oldPassword: String
                    let newPassword: String
                }
            }
            
            struct PasswordUpdateResponse: Codable {
                let success: Bool
                let error: String?
                let message: String?
            }
            
            let response = try await apiClient.request(
                endpoint: APIEndpoint(
                    path: APIRoutes.User.changePassword,
                    method: .PATCH,
                    body: ChangePasswordRequest(
                        data: ChangePasswordRequest.PasswordData(
                            oldPassword: currentPassword,
                            newPassword: newPassword
                        )
                    )
                ),
                responseType: PasswordUpdateResponse.self
            )
            
            if response.success {
                print("✅ AuthManager: Successfully changed password")
                return true
            } else {
                print("❌ AuthManager: Password change failed: \(response.error ?? "Unknown error")")
                return false
            }
        } catch {
            print("❌ AuthManager: Failed to change password: \(error)")
            return false
        }
    }
    
    func deleteAccount(password: String) async -> Bool {
        do {
            struct DeactivateAccountRequest: Codable {
                let data: AccountData
                
                struct AccountData: Codable {
                    let password: String
                }
            }
            
            struct DeactivateAccountResponse: Codable {
                let success: Bool
                let error: String?
                let message: String?
            }
            
            let response = try await apiClient.request(
                endpoint: APIEndpoint(
                    path: APIRoutes.User.deactivateAccount,
                    method: .POST,
                    body: DeactivateAccountRequest(
                        data: DeactivateAccountRequest.AccountData(password: password)
                    )
                ),
                responseType: DeactivateAccountResponse.self
            )
            
            if response.success {
                // Account deactivated successfully - sign out
                await signOut()
                print("✅ AuthManager: Successfully deactivated account")
                return true
            } else {
                print("❌ AuthManager: Account deactivation failed: \(response.error ?? "Unknown error")")
                return false
            }
        } catch {
            print("❌ AuthManager: Failed to deactivate account: \(error)")
            return false
        }
    }
    
    // MARK: - Background Token Check
    func startTokenCheckTimer() {
        // Check token every minute (like React Native app)
        Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { _ in
            Task { @MainActor in
                guard let token = self.keychainManager.getAuthToken() else {
                    return
                }
                
                if self.isTokenExpired(token) {
                    print("🔐 AuthManager: Token expired during session, signing out")
                    await self.signOut()
                }
            }
        }
        
        // Periodically update user data every 10 minutes (like React Native app)
        Timer.scheduledTimer(withTimeInterval: 600, repeats: true) { _ in
            Task { @MainActor in
                guard self.isAuthenticated else { return }
                
                do {
                    let user = try await self.fetchCurrentUser()
                    self.currentUser = user
                    
                    // Check if account is disabled
                    if user.isAccountDisabled == true {
                        print("🔐 AuthManager: Account is disabled, signing out")
                        await self.signOut()
                    }
                } catch {
                    print("🔐 AuthManager: Failed to update user data: \(error)")
                }
            }
        }
    }
}

// MARK: - Supporting Types
enum AuthError: LocalizedError {
    case invalidCredentials
    case userNotFound
    case networkError
    case serverError(String)
    // case googleSignInFailed(String) // Will be added in Phase 4
    case passwordResetSent
    case unknownError
    
    var errorDescription: String? {
        switch self {
        case .invalidCredentials:
            return "Invalid email or password"
        case .userNotFound:
            return "User not found"
        case .networkError:
            return "Network connection error"
        case .serverError(let message):
            return message
        // case .googleSignInFailed(let message):
        //     return "Google Sign-In failed: \(message)"
        case .passwordResetSent:
            return "Password reset email sent"
        case .unknownError:
            return "An unknown error occurred"
        }
    }
    
    var isSuccess: Bool {
        switch self {
        case .passwordResetSent:
            return true
        default:
            return false
        }
    }
}

struct AuthResponse: Codable {
    let token: String
    let user: User
}

struct EmailLoginRequest: Codable {
    let data: LoginData
    
    struct LoginData: Codable {
        let email: String
        let password: String
    }
    
    init(email: String, password: String) {
        self.data = LoginData(email: email, password: password)
    }
}

struct EmailRegisterRequest: Codable {
    let data: RegisterData
    
    struct RegisterData: Codable {
        let email: String
        let password: String
        let name: String
    }
    
    init(email: String, password: String, name: String) {
        self.data = RegisterData(email: email, password: password, name: name)
    }
}

// struct GoogleSignInRequest: Codable {
//     let email: String
// } // Will be added in Phase 4

struct ResetPasswordRequest: Codable {
    let data: ResetData
    
    struct ResetData: Codable {
        let email: String
    }
    
    init(email: String) {
        self.data = ResetData(email: email)
    }
}


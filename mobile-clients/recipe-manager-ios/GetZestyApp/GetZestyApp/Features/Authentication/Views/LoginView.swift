//
//  LoginView.swift
//  GetZestyApp
//
//  Email/password login screen - matches React Native design
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var authManager: AuthenticationManager
    @EnvironmentObject private var appCoordinator: AppCoordinator
    
    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var showingResetPassword = false
    @State private var showingRegistration = false
    
    @FocusState private var focusedField: Field?
    
    enum Field {
        case email, password
    }
    
    var body: some View {
        NavigationStack {
            GeometryReader { geometry in
                ScrollView {
                    VStack(spacing: 32) {
                        // Header Section
                        VStack(spacing: 24) {
                            VStack(spacing: 12) {
                                Text("Welcome Back")
                                    .font(.system(size: isLargeDevice ? 36 : 32, weight: .bold))
                                    .foregroundColor(Color(UIColor.label))
                                    .padding(.bottom, 12)
                                
                                Text("Sign in to continue")
                                    .font(.system(size: isLargeDevice ? 18 : 16))
                                    .foregroundColor(.secondaryText)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                        
                        // Form Section
                        VStack(spacing: 16) {
                            // Email Field
                            InputField.email(
                                title: "Email",
                                placeholder: "email@example.com",
                                text: $email
                            )
                            .focused($focusedField, equals: .email)
                            .submitLabel(.next)
                            .onSubmit {
                                focusedField = .password
                            }
                            
                            // Password Field
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Password")
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(.primaryText)
                                
                                HStack {
                                    Group {
                                        if showPassword {
                                            TextField("Enter your password", text: $password)
                                        } else {
                                            SecureField("Enter your password", text: $password)
                                        }
                                    }
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.primaryText)
                                    .textContentType(.password)
                                    .autocapitalization(.none)
                                    .focused($focusedField, equals: .password)
                                    .submitLabel(.go)
                                    .onSubmit(handleLogin)
                                    
                                    Button(action: { showPassword.toggle() }) {
                                        Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                                            .foregroundColor(.secondary)
                                            .font(.system(size: 16))
                                    }
                                    .padding(.trailing, 4)
                                }
                                .padding(.horizontal, 16)
                                .padding(.vertical, 16)
                                .background(Color(.systemGray6))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .stroke(focusedField == .password ? Color.brandPrimary : Color(.systemGray4), lineWidth: 1)
                                )
                                .cornerRadius(16)
                            }
                            
                            // Forgot Password Link
                            HStack {
                                Spacer()
                                Button("Forgot Password?") {
                                    showingResetPassword = true
                                }
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(.brandPrimary)
                            }
                            .padding(.top, -8)
                            
                            // Error Message
                            if let error = authManager.authError {
                                ErrorMessageView(error: error)
                                    .padding(.top, 8)
                            }
                            
                            // Sign In Button
                            CustomButton.primary(
                                "Sign In",
                                action: handleLogin,
                                isLoading: authManager.isLoading,
                                isDisabled: !isFormValid
                            )
                            .padding(.top, 16)
                            
                            // Sign Up Link
                            HStack(spacing: 4) {
                                Text("Don't have an account?")
                                    .font(.system(size: 18))
                                    .foregroundColor(.secondaryText)
                                
                                Button("Sign up") {
                                    showingRegistration = true
                                }
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(.brandPrimary)
                            }
                            .padding(.top, 32)
                        }
                        .padding(.horizontal, 16)
                        
                        Spacer(minLength: 40)
                    }
                    .frame(maxWidth: 448) // max-w-md equivalent
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: geometry.size.height * 0.6)
                }
            }
            .background(Color(UIColor.systemBackground))
            .ignoresSafeArea(.keyboard)
            .sheet(isPresented: $showingResetPassword) {
                PasswordResetView()
            }
            .sheet(isPresented: $showingRegistration) {
                RegisterView()
            }
            .onAppear {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    focusedField = .email
                }
            }
        }
    }
    
    // MARK: - Computed Properties
    private var isFormValid: Bool {
        !email.isEmpty && !password.isEmpty
    }
    
    private var isLargeDevice: Bool {
        UIScreen.main.bounds.width >= 428 // iPhone 16 Pro Max and larger
    }
    
    // MARK: - Actions
    private func handleLogin() {
        focusedField = nil
        Task {
            await authManager.signInWithEmail(email, password: password)
        }
    }
}


// MARK: - Error Message View

struct ErrorMessageView: View {
    let error: AuthError
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: error.isSuccess ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                .foregroundColor(error.isSuccess ? .green : .red)
                .font(.system(size: 16))
            
            Text(error.localizedDescription)
                .font(.system(size: 14))
                .foregroundColor(error.isSuccess ? .green : .red)
                .multilineTextAlignment(.leading)
            
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(error.isSuccess ? Color.green.opacity(0.1) : Color.red.opacity(0.1))
        )
    }
}


#Preview {
    LoginView()
        .environmentObject(AuthenticationManager())
        .environmentObject(AppCoordinator())
}
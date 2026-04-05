//
//  PasswordResetView.swift
//  GetZestyApp
//
//  Password reset request screen - matches React Native design
//

import SwiftUI

struct PasswordResetView: View {
    @EnvironmentObject private var authManager: AuthenticationManager
    @Environment(\.dismiss) private var dismiss
    
    @State private var email = ""
    @State private var showSuccessMessage = false
    @FocusState private var isEmailFocused: Bool
    
    private var isLargeDevice: Bool {
        UIScreen.main.bounds.width >= 428
    }
    
    var body: some View {
        NavigationStack {
            GeometryReader { geometry in
                ScrollView {
                    VStack(spacing: 32) {
                        // Header Section
                        VStack(spacing: 24) {
                            VStack(spacing: 12) {
                                Text("Reset Password")
                                    .font(.system(size: isLargeDevice ? 36 : 32, weight: .bold))
                                    .foregroundColor(Color(UIColor.label))
                                    .padding(.bottom, 12)
                                
                                Text("Enter your email and we'll send you a link to reset your password")
                                    .font(.system(size: isLargeDevice ? 18 : 16))
                                    .foregroundColor(.secondaryText)
                                    .multilineTextAlignment(.center)
                                    .padding(.horizontal, 16)
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
                            .focused($isEmailFocused)
                            .submitLabel(.send)
                            .onSubmit(handlePasswordReset)
                            
                            // Error/Success Message
                            if let error = authManager.authError {
                                ErrorMessageView(error: error)
                                    .padding(.top, 8)
                                    .onAppear {
                                        if error.isSuccess {
                                            showSuccessMessage = true
                                            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                                                dismiss()
                                            }
                                        }
                                    }
                            }
                            
                            // Send Reset Link Button
                            CustomButton.primary(
                                "Send Reset Link",
                                action: handlePasswordReset,
                                isLoading: authManager.isLoading,
                                isDisabled: email.isEmpty
                            )
                            .padding(.top, 16)
                            
                            // Back to Sign In Link
                            Button("Back to Sign In") {
                                dismiss()
                            }
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.brandPrimary)
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
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
            .onAppear {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    isEmailFocused = true
                }
            }
        }
    }
    
    private func handlePasswordReset() {
        Task {
            await authManager.resetPassword(email)
        }
    }
}

#Preview {
    PasswordResetView()
        .environmentObject(AuthenticationManager())
}
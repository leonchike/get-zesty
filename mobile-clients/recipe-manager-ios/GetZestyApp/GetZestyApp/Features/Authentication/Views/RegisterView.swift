//
//  RegisterView.swift
//  GetZestyApp
//
//  User registration screen - matches React Native design
//

import SwiftUI

struct RegisterView: View {
    @EnvironmentObject private var authManager: AuthenticationManager
    @Environment(\.dismiss) private var dismiss
    
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    
    @FocusState private var focusedField: Field?
    
    enum Field {
        case name, email, password
    }
    
    private var isFormValid: Bool {
        !name.isEmpty && !email.isEmpty && !password.isEmpty && password.count >= 8
    }
    
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
                                Text("Create an account")
                                    .font(.system(size: isLargeDevice ? 36 : 32, weight: .bold))
                                    .foregroundColor(Color(UIColor.label))
                                    .padding(.bottom, 12)
                                
                                Text("Sign up to continue")
                                    .font(.system(size: isLargeDevice ? 18 : 16))
                                    .foregroundColor(.secondaryText)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                        
                        // Form Section
                        VStack(spacing: 16) {
                            // Name Field
                            InputField.text(
                                title: "Name",
                                placeholder: "Enter your name",
                                text: $name
                            )
                            .focused($focusedField, equals: .name)
                            .submitLabel(.next)
                            .onSubmit {
                                focusedField = .email
                            }
                            
                            // Email Field
                            InputField.email(
                                title: "Email",
                                placeholder: "Enter your email",
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
                                    .textContentType(.newPassword)
                                    .autocapitalization(.none)
                                    .focused($focusedField, equals: .password)
                                    .submitLabel(.go)
                                    .onSubmit(handleRegister)
                                    
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
                            
                            // Error Message
                            if let error = authManager.authError {
                                ErrorMessageView(error: error)
                                    .padding(.top, 8)
                            }
                            
                            // Sign Up Button
                            CustomButton.primary(
                                "Sign up with Email",
                                action: handleRegister,
                                isLoading: authManager.isLoading,
                                isDisabled: !isFormValid
                            )
                            .padding(.top, 16)
                            
                            // Sign In Link
                            HStack(spacing: 4) {
                                Text("Already have an account?")
                                    .font(.system(size: 18))
                                    .foregroundColor(.secondaryText)
                                
                                Button("Sign in") {
                                    dismiss()
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
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .onAppear {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    focusedField = .name
                }
            }
        }
    }
    
    private func handleRegister() {
        guard isFormValid else { return }
        
        focusedField = nil
        Task {
            await authManager.signUpWithEmail(email, password: password, name: name)
            if authManager.authError == nil {
                dismiss()
            }
        }
    }
}

#Preview {
    RegisterView()
        .environmentObject(AuthenticationManager())
}
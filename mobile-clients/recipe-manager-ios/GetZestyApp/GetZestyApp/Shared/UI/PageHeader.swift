//
//  PageHeader.swift
//  GetZestyApp
//
//  Fixed header component for main pages with title and user avatar
//

import SwiftUI

struct PageHeader: View {
    let title: String
    @EnvironmentObject private var authManager: AuthenticationManager
    @EnvironmentObject private var appCoordinator: AppCoordinator
    @State private var showingSettings = false

    
    var body: some View {
        VStack(spacing: 0) {
            // Header content with safe area consideration
            HStack(alignment: .center) {
                // Page Title
                Text(title)
                    .font(.system(size: 32, weight: .bold, design: .default))
                    .foregroundColor(.primaryText)
                
                Spacer()
                
                // User Avatar
                UserAvatarButton(showingSettings: $showingSettings)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Color(.systemBackground))
        }
        .background(Color(.systemBackground))
        .sheet(isPresented: $showingSettings) {
            SettingsBottomSheet()
                .presentationDetents([.fraction(0.5)])
                .presentationDragIndicator(.visible)
        }
    }
}

struct UserAvatarButton: View {
    @Binding var showingSettings: Bool
    @EnvironmentObject private var authManager: AuthenticationManager
    @Environment(\.colorScheme) private var colorScheme
    
    var body: some View {
        // Debug: Print user state
        let _ = print("🔍 UserAvatarButton: User = \(authManager.currentUser?.email ?? "nil"), isAuthenticated = \(authManager.isAuthenticated)")
        
        Button(action: {
            showingSettings = true
        }) {
            AsyncImage(url: userImageURL) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                // Fallback to default avatar based on color scheme
                let imageName = colorScheme == .dark ? "avatar-dark" : "avatar-light"
                let _ = print("🔍 Using fallback image: \(imageName)")
                
                Image(imageName)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            }
            .frame(width: 40, height: 40)
            .clipShape(Circle())
            .overlay(
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 0.5)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private var userImageURL: URL? {
        guard let imageString = authManager.currentUser?.image,
              !imageString.isEmpty else {
            return nil
        }
        return URL(string: imageString)
    }
}

struct SettingsBottomSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appCoordinator: AppCoordinator
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            VStack(spacing: 16) {
                // Drag indicator (iOS provides this automatically with .presentationDragIndicator)
                
                Text("More options")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.primaryText)
                    .padding(.top, 24)
            }
            .padding(.horizontal, 16)
            
            // Content
            VStack(spacing: 20) {
                // Create Recipe Button
                CustomButton.primary("Create a new recipe", action: {
                    dismiss()
                    appCoordinator.presentSheet(.createRecipe)
                }, size: .medium)
                
                // Settings Button
                CustomButton.ghost("Settings", action: {
                    dismiss()
                    appCoordinator.presentSheet(.settings)
                }, size: .medium)
            }
            .padding(.horizontal, 16)
            .padding(.top, 32)
            .padding(.bottom, 16)
            
            Spacer()
        }
        .background(Color(.systemBackground))
    }
}

#Preview("Header - In Context") {
    NavigationStack {
        VStack(spacing: 0) {
            ScrollView {
                VStack {
                    ForEach(0..<20) { i in
                        Text("Item \(i)")
                            .padding()
                    }
                }
            }
        }
        .navigationBarHidden(true)
        .safeAreaInset(edge: .top) {
            PageHeader(title: "Recipes")
                .environmentObject(AuthenticationManager())
                .environmentObject(AppCoordinator())
        }
    }
}

#Preview("Header - Isolated") {
    VStack {
        PageHeader(title: "Groceries")
            .environmentObject(AuthenticationManager())
            .environmentObject(AppCoordinator())
        Spacer()
    }
}

#Preview("Settings Sheet") {
    PreviewWrapper {
        SettingsBottomSheet()
    }
}

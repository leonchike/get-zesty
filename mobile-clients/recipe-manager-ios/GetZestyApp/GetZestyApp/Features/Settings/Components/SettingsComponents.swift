//
//  SettingsComponents.swift
//  GetZestyApp
//
//  Reusable components for Settings feature
//

import SwiftUI

// MARK: - Settings Header

struct SettingsHeader: View {
    let title: String
    let showBackButton: Bool
    let onBack: (() -> Void)?
    
    init(title: String, showBackButton: Bool = false, onBack: (() -> Void)? = nil) {
        self.title = title
        self.showBackButton = showBackButton
        self.onBack = onBack
    }
    
    var body: some View {
        HStack {
            // Left side - fixed width for back button
            HStack {
                if showBackButton {
                    Button(action: {
                        onBack?()
                    }) {
                        HStack {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 16, weight: .medium))
                        }
                        .foregroundColor(.brandPrimary)
                    }
                }
            }
            .frame(width: showBackButton ? 60 : 0, alignment: .leading)
            
            // Center title - flexible but prioritized
            HStack {
                Spacer()
                Text(title)
                    .font(AppTypography.title(.semibold))
                    .foregroundColor(.primaryText)
                    .multilineTextAlignment(.center)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                Spacer()
            }
            
            // Right side - fixed width to balance left side
            HStack {
                // Empty space to balance the back button
            }
            .frame(width: showBackButton ? 60 : 0, alignment: .trailing)
        }
        .padding(.horizontal, AppSpacing.lg)
        .padding(.bottom, AppSpacing.lg)
    }
}

// MARK: - Settings Button Row

struct SettingsButton: View {
    let title: String
    let description: String
    let iconName: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: AppSpacing.md) {
                // Icon container
                ZStack {
                    Circle()
                        .fill(Color(.systemGray5))
                        .frame(width: 50, height: 50)
                    
                    Image(systemName: iconName)
                        .font(.system(size: 20, weight: .medium))
                        .foregroundColor(.primaryText)
                }
                
                // Text content
                VStack(alignment: .leading, spacing: AppSpacing.xxs) {
                    Text(title)
                        .font(AppTypography.headline(.bold))
                        .foregroundColor(.primaryText)
                    
                    Text(description)
                        .font(AppTypography.callout(.medium))
                        .foregroundColor(.secondaryText)
                }
                
                Spacer()
                
                // Right chevron
                Image(systemName: "chevron.right")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.primaryText)
            }
            .padding(.horizontal, AppSpacing.lg)
            .padding(.vertical, AppSpacing.sm)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Settings Message View

struct SettingsMessageView: View {
    let message: String
    let isError: Bool
    
    var body: some View {
        HStack(spacing: AppSpacing.xs) {
            Image(systemName: isError ? "exclamationmark.triangle.fill" : "checkmark.circle.fill")
                .foregroundColor(isError ? .error : .success)
                .font(.system(size: 16))
            
            Text(message)
                .font(AppTypography.callout(.medium))
                .foregroundColor(isError ? .error : .success)
                .multilineTextAlignment(.leading)
            
            Spacer()
        }
        .padding(.horizontal, AppSpacing.sm)
        .padding(.vertical, AppSpacing.xs)
        .background(
            RoundedRectangle(cornerRadius: AppRadius.sm)
                .fill((isError ? Color.error : Color.success).opacity(0.1))
        )
    }
}

// MARK: - Logout Button

struct LogoutButton: View {
    let action: () -> Void
    
    var body: some View {
        CustomButton.tertiary(
            "Log Out",
            action: action,
            size: .small
        )
        .padding(.horizontal, AppSpacing.lg)
        .padding(.vertical, 16)
    }
}

// MARK: - Settings Container

struct SettingsContainer<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: AppSpacing.xl) {
                content
            }
            .padding(.top, AppSpacing.lg)
            .padding(.bottom, AppSpacing.huge)
        }
        .background(Color.backgroundPrimary)
    }
}

// MARK: - Settings Preview Container

private struct SettingsPreviewContainer<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.backgroundPrimary)
    }
}

// MARK: - Previews

#Preview("Settings Header") {
    SettingsPreviewContainer {
        VStack(spacing: AppSpacing.lg) {
            SettingsHeader(title: "Settings")
            
            SettingsHeader(
                title: "Profile",
                showBackButton: true,
                onBack: { print("Back tapped") }
            )
        }
    }
}

#Preview("Settings Button") {
    SettingsPreviewContainer {
        VStack(spacing: AppSpacing.lg) {
            SettingsButton(
                title: "Profile",
                description: "Edit your profile information",
                iconName: "pencil"
            ) {
                print("Profile tapped")
            }
            
            SettingsButton(
                title: "Security",
                description: "Change your password",
                iconName: "lock"
            ) {
                print("Security tapped")
            }
            
            SettingsButton(
                title: "Delete",
                description: "Delete your account",
                iconName: "minus.circle"
            ) {
                print("Delete tapped")
            }
        }
        .padding()
    }
}

#Preview("Settings Messages") {
    SettingsPreviewContainer {
        VStack(spacing: AppSpacing.md) {
            SettingsMessageView(
                message: "Profile updated successfully",
                isError: false
            )
            
            SettingsMessageView(
                message: "Failed to update password. Please check your current password.",
                isError: true
            )
        }
        .padding()
    }
}

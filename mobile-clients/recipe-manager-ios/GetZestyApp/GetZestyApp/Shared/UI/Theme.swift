//
//  Theme.swift
//  GetZestyApp
//
//  Centralized theme and color management system
//

import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

// MARK: - App Theme

struct AppTheme {
    // MARK: - Brand Colors
    static let brandPrimary = Color(red: 1.0, green: 0.220, blue: 0.361) // #FF385C - Zesty Red
    static let brandSecondary = Color(red: 1.0, green: 0.596, blue: 0.0) // #FF9800 - Orange accent
    
    // MARK: - Semantic Colors (adapt to light/dark mode)
    #if canImport(UIKit)
    static let primaryText = Color(UIColor.label)
    static let secondaryText = Color(UIColor.secondaryLabel)
    static let tertiaryText = Color(UIColor.tertiaryLabel)
    
    static let backgroundPrimary = Color(UIColor.systemBackground)
    static let backgroundSecondary = Color(UIColor.secondarySystemBackground)
    static let backgroundTertiary = Color(UIColor.tertiarySystemBackground)
    
    static let surfacePrimary = Color(UIColor.systemGroupedBackground)
    static let surfaceSecondary = Color(UIColor.secondarySystemGroupedBackground)
    
    // MARK: - Input Colors (adapt to light/dark mode)
    static let inputBackground = Color(UIColor.systemGray6)
    static let inputBorder = Color(UIColor.systemGray4)
    static let inputBorderFocused = brandPrimary
    
    // MARK: - Status Colors
    static let success = Color(UIColor.systemGreen)
    static let warning = Color(UIColor.systemOrange)
    static let error = Color(UIColor.systemRed)
    static let info = Color(UIColor.systemBlue)
    
    // MARK: - Component Colors
    static let cardBackground = Color(UIColor.secondarySystemGroupedBackground)
    static let separatorColor = Color(UIColor.separator)
    #else
    // Fallback colors for non-UIKit environments
    static let primaryText = Color.primary
    static let secondaryText = Color.secondary
    static let tertiaryText = Color.secondary.opacity(0.6)
    
    static let backgroundPrimary = Color(red: 0.98, green: 0.98, blue: 0.98)
    static let backgroundSecondary = Color(red: 0.94, green: 0.94, blue: 0.96)
    static let backgroundTertiary = Color(red: 0.90, green: 0.90, blue: 0.92)
    
    static let surfacePrimary = Color(red: 0.96, green: 0.96, blue: 0.98)
    static let surfaceSecondary = Color(red: 0.92, green: 0.92, blue: 0.94)
    
    static let inputBackground = Color(red: 0.90, green: 0.90, blue: 0.92)
    static let inputBorder = Color(red: 0.78, green: 0.78, blue: 0.80)
    static let inputBorderFocused = brandPrimary
    
    static let success = Color.green
    static let warning = Color.orange
    static let error = Color.red
    static let info = Color.blue
    
    static let cardBackground = Color(red: 0.92, green: 0.92, blue: 0.94)
    static let separatorColor = Color.gray.opacity(0.3)
    #endif
    
    static let shadowColor = Color.black.opacity(0.1)
}

// MARK: - Typography Scale

struct AppTypography {
    // MARK: - Font Sizes
    static let extraLarge: CGFloat = 36
    static let large: CGFloat = 32
    static let title: CGFloat = 24
    static let headline: CGFloat = 20
    static let body: CGFloat = 16
    static let callout: CGFloat = 14
    static let caption: CGFloat = 12
    static let small: CGFloat = 10
    
    // MARK: - Font Styles
    static func extraLarge(_ weight: Font.Weight = .bold) -> Font {
        .system(size: extraLarge, weight: weight)
    }
    
    static func large(_ weight: Font.Weight = .bold) -> Font {
        .system(size: large, weight: weight)
    }
    
    static func title(_ weight: Font.Weight = .semibold) -> Font {
        .system(size: title, weight: weight)
    }
    
    static func headline(_ weight: Font.Weight = .semibold) -> Font {
        .system(size: headline, weight: weight)
    }
    
    static func body(_ weight: Font.Weight = .regular) -> Font {
        .system(size: body, weight: weight)
    }
    
    static func callout(_ weight: Font.Weight = .medium) -> Font {
        .system(size: callout, weight: weight)
    }
    
    static func caption(_ weight: Font.Weight = .regular) -> Font {
        .system(size: caption, weight: weight)
    }
}

// MARK: - Spacing Scale

struct AppSpacing {
    static let xxxs: CGFloat = 2
    static let xxs: CGFloat = 4
    static let xs: CGFloat = 8
    static let sm: CGFloat = 12
    static let md: CGFloat = 16
    static let lg: CGFloat = 20
    static let xl: CGFloat = 24
    static let xxl: CGFloat = 32
    static let xxxl: CGFloat = 40
    static let huge: CGFloat = 48
}

// MARK: - Corner Radius Scale

struct AppRadius {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 20
    static let xxl: CGFloat = 24
    static let full: CGFloat = 9999 // For fully rounded elements
}

// MARK: - Shadow Styles

struct AppShadow {
    static let small = Shadow(color: AppTheme.shadowColor, radius: 2, x: 0, y: 1)
    static let medium = Shadow(color: AppTheme.shadowColor, radius: 4, x: 0, y: 2)
    static let large = Shadow(color: AppTheme.shadowColor, radius: 8, x: 0, y: 4)
}

struct Shadow {
    let color: Color
    let radius: CGFloat
    let x: CGFloat
    let y: CGFloat
}

// MARK: - Convenience Extensions

extension Color {
    // Brand colors
    static let brandPrimary = AppTheme.brandPrimary
    static let brandSecondary = AppTheme.brandSecondary
    
    // Text colors
    static let primaryText = AppTheme.primaryText
    static let secondaryText = AppTheme.secondaryText
    static let tertiaryText = AppTheme.tertiaryText
    
    // Background colors
    static let backgroundPrimary = AppTheme.backgroundPrimary
    static let backgroundSecondary = AppTheme.backgroundSecondary
    static let backgroundTertiary = AppTheme.backgroundTertiary
    
    // Surface colors
    static let surfacePrimary = AppTheme.surfacePrimary
    static let surfaceSecondary = AppTheme.surfaceSecondary
    
    // Input colors
    static let inputBackground = AppTheme.inputBackground
    static let inputBorder = AppTheme.inputBorder
    static let inputBorderFocused = AppTheme.inputBorderFocused
    
    // Status colors
    static let success = AppTheme.success
    static let warning = AppTheme.warning
    static let error = AppTheme.error
    static let info = AppTheme.info
    
    // Component colors
    static let cardBackground = AppTheme.cardBackground
    static let separatorColor = AppTheme.separatorColor
}

extension View {
    // Shadow modifiers
    func shadow(_ shadow: Shadow) -> some View {
        self.shadow(color: shadow.color, radius: shadow.radius, x: shadow.x, y: shadow.y)
    }
    
    func smallShadow() -> some View {
        shadow(AppShadow.small)
    }
    
    func mediumShadow() -> some View {
        shadow(AppShadow.medium)
    }
    
    func largeShadow() -> some View {
        shadow(AppShadow.large)
    }
}

// MARK: - Theme Preview

#Preview("Theme Colors - Light Mode") {
    ThemePreviewContent()
        .preferredColorScheme(.light)
}

#Preview("Theme Colors - Dark Mode") {
    ThemePreviewContent()
        .preferredColorScheme(.dark)
}

struct ThemePreviewContent: View {
    var body: some View {
        ScrollView {
            VStack(spacing: AppSpacing.lg) {
                // Brand Colors
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text("Brand Colors")
                        .font(AppTypography.headline())
                        .foregroundColor(.primaryText)
                    
                    HStack(spacing: AppSpacing.sm) {
                        ColorSwatch(name: "Primary", color: .brandPrimary)
                        ColorSwatch(name: "Secondary", color: .brandSecondary)
                    }
                }
                
                // Text Colors
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text("Text Colors")
                        .font(AppTypography.headline())
                        .foregroundColor(.primaryText)
                    
                    VStack(spacing: AppSpacing.xs) {
                        HStack {
                            Text("Primary Text")
                                .foregroundColor(.primaryText)
                            Spacer()
                        }
                        HStack {
                            Text("Secondary Text")
                                .foregroundColor(.secondaryText)
                            Spacer()
                        }
                        HStack {
                            Text("Tertiary Text")
                                .foregroundColor(.tertiaryText)
                            Spacer()
                        }
                    }
                }
                
                // Background Colors
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text("Background Colors")
                        .font(AppTypography.headline())
                        .foregroundColor(.primaryText)
                    
                    VStack(spacing: AppSpacing.xs) {
                        ColorCard(name: "Primary Background", color: .backgroundPrimary)
                        ColorCard(name: "Secondary Background", color: .backgroundSecondary)
                        ColorCard(name: "Tertiary Background", color: .backgroundTertiary)
                    }
                }
                
                // Surface Colors
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text("Surface Colors")
                        .font(AppTypography.headline())
                        .foregroundColor(.primaryText)
                    
                    VStack(spacing: AppSpacing.xs) {
                        ColorCard(name: "Primary Surface", color: .surfacePrimary)
                        ColorCard(name: "Secondary Surface", color: .surfaceSecondary)
                        ColorCard(name: "Card Background", color: .cardBackground)
                    }
                }
                
                // Status Colors
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text("Status Colors")
                        .font(AppTypography.headline())
                        .foregroundColor(.primaryText)
                    
                    HStack(spacing: AppSpacing.sm) {
                        ColorSwatch(name: "Success", color: .success)
                        ColorSwatch(name: "Warning", color: .warning)
                        ColorSwatch(name: "Error", color: .error)
                        ColorSwatch(name: "Info", color: .info)
                    }
                }
                
                // Typography Scale
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text("Typography Scale")
                        .font(AppTypography.headline())
                        .foregroundColor(.primaryText)
                    
                    VStack(alignment: .leading, spacing: AppSpacing.xs) {
                        Text("Extra Large")
                            .font(AppTypography.extraLarge())
                        Text("Large Title")
                            .font(AppTypography.large())
                        Text("Title")
                            .font(AppTypography.title())
                        Text("Headline")
                            .font(AppTypography.headline())
                        Text("Body Text")
                            .font(AppTypography.body())
                        Text("Callout Text")
                            .font(AppTypography.callout())
                        Text("Caption Text")
                            .font(AppTypography.caption())
                    }
                }
                
                // Shadow Examples
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text("Shadow Styles")
                        .font(AppTypography.headline())
                        .foregroundColor(.primaryText)
                    
                    HStack(spacing: AppSpacing.md) {
                        RoundedRectangle(cornerRadius: AppRadius.sm)
                            .fill(Color.white)
                            .frame(width: 80, height: 60)
                            .smallShadow()
                            .overlay(
                                Text("Small")
                                    .font(AppTypography.caption())
                                    .foregroundColor(.primaryText)
                            )
                        
                        RoundedRectangle(cornerRadius: AppRadius.sm)
                            .fill(Color.white)
                            .frame(width: 80, height: 60)
                            .mediumShadow()
                            .overlay(
                                Text("Medium")
                                    .font(AppTypography.caption())
                                    .foregroundColor(.primaryText)
                            )
                        
                        RoundedRectangle(cornerRadius: AppRadius.sm)
                            .fill(Color.white)
                            .frame(width: 80, height: 60)
                            .largeShadow()
                            .overlay(
                                Text("Large")
                                    .font(AppTypography.caption())
                                    .foregroundColor(.primaryText)
                            )
                    }
                }
            }
            .padding(AppSpacing.lg)
        }
        .background(Color.backgroundPrimary)
    }
}

struct ColorSwatch: View {
    let name: String
    let color: Color
    
    var body: some View {
        VStack(spacing: AppSpacing.xs) {
            RoundedRectangle(cornerRadius: AppRadius.sm)
                .fill(color)
                .frame(width: 60, height: 40)
            
            Text(name)
                .font(AppTypography.caption())
                .foregroundColor(.secondaryText)
        }
    }
}

struct ColorCard: View {
    let name: String
    let color: Color
    
    var body: some View {
        HStack {
            Text(name)
                .font(AppTypography.body())
                .foregroundColor(.primaryText)
            Spacer()
            RoundedRectangle(cornerRadius: AppRadius.sm)
                .fill(color)
                .frame(width: 60, height: 30)
                .overlay(
                    RoundedRectangle(cornerRadius: AppRadius.sm)
                        .stroke(Color.separatorColor, lineWidth: 1)
                )
        }
        .padding(AppSpacing.sm)
        .background(color.opacity(0.1))
        .cornerRadius(AppRadius.sm)
    }
}

//
//  CustomButton.swift
//  GetZestyApp
//
//  Reusable button component with React Native app variants
//

import SwiftUI

struct CustomButton: View {
    let title: String
    let action: () -> Void
    var variant: ButtonVariant = .primary
    var size: ButtonSize = .large
    var isLoading: Bool = false
    var isDisabled: Bool = false
    var containerStyles: (() -> AnyView)? = nil
    var textStyles: (() -> AnyView)? = nil
    
    @Environment(\.colorScheme) private var colorScheme
    
    var body: some View {
        Button(action: {
            if !isDisabled && !isLoading {
                action()
            }
        }) {
            HStack {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: textColor))
                        .scaleEffect(0.8)
                        .padding(.trailing, 4)
                }
                
                Text(title)
                    .font(textFont)
                    .fontWeight(.medium)
                    .foregroundColor(textColor)
                    .opacity(isDisabled || isLoading ? 0.5 : 1.0)
            }
            .frame(maxWidth: .infinity)
            .frame(height: buttonHeight)
            .background(backgroundColor)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(borderColor, lineWidth: borderWidth)
            )
            .cornerRadius(12)
            .opacity(isDisabled ? 0.5 : 1.0)
        }
        .buttonStyle(CustomButtonStyle(variant: variant))
        .disabled(isDisabled || isLoading)
    }
    
    // MARK: - Computed Properties
    
    private var backgroundColor: Color {
        let baseColor: Color
        
        switch variant {
        case .primary:
            baseColor = .brandPrimary
        case .secondary:
            baseColor = colorScheme == .dark ? Color(.systemGray6) : Color(.systemBackground)
        case .tertiary:
            baseColor = Color(.systemGray5)
        case .danger:
            baseColor = .red
        case .ghost:
            baseColor = .clear
        }
        
        return baseColor
    }
    
    private var textColor: Color {
        switch variant {
        case .primary, .danger:
            return .white
        case .secondary:
            return .primaryText
        case .tertiary:
            return .secondary
        case .ghost:
            return .brandPrimary
        }
    }
    
    private var borderColor: Color {
        switch variant {
        case .primary, .danger, .tertiary:
            return .clear
        case .secondary:
            return Color(.systemGray4)
        case .ghost:
            return .brandPrimary
        }
    }
    
    private var borderWidth: CGFloat {
        switch variant {
        case .primary, .danger, .tertiary:
            return 0
        case .secondary, .ghost:
            return 1
        }
    }
    
    private var buttonHeight: CGFloat {
        switch size {
        case .small:
            return 40
        case .medium:
            return 48
        case .large:
            return 56
        }
    }
    
    private var textFont: Font {
        switch size {
        case .small:
            return .system(size: 14)
        case .medium:
            return .system(size: 16)
        case .large:
            return .system(size: 16)
        }
    }
}

// MARK: - Button Variants

enum ButtonVariant {
    case primary    // Brand color background with white text
    case secondary  // Light/dark background with contrasting text
    case tertiary   // Gray background with muted styling
    case danger     // Red background for destructive actions
    case ghost      // Transparent background with border
}

enum ButtonSize {
    case small
    case medium
    case large
}

// MARK: - Custom Button Style

struct CustomButtonStyle: ButtonStyle {
    let variant: ButtonVariant
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// MARK: - Convenience Initializers

extension CustomButton {
    // Primary button with text only
    static func primary(
        _ title: String,
        action: @escaping () -> Void,
        size: ButtonSize = .large,
        isLoading: Bool = false,
        isDisabled: Bool = false
    ) -> CustomButton {
        CustomButton(
            title: title,
            action: action,
            variant: .primary,
            size: size,
            isLoading: isLoading,
            isDisabled: isDisabled
        )
    }
    
    // Secondary button with text only
    static func secondary(
        _ title: String,
        action: @escaping () -> Void,
        size: ButtonSize = .large,
        isLoading: Bool = false,
        isDisabled: Bool = false
    ) -> CustomButton {
        CustomButton(
            title: title,
            action: action,
            variant: .secondary,
            size: size,
            isLoading: isLoading,
            isDisabled: isDisabled
        )
    }
    
    // Tertiary button with text only (similar to ghost but with underline)
    static func tertiary(
        _ title: String,
        action: @escaping () -> Void,
        size: ButtonSize = .large,
        isLoading: Bool = false,
        isDisabled: Bool = false
    ) -> CustomButton {
        CustomButton(
            title: title,
            action: action,
            variant: .tertiary,
            size: size,
            isLoading: isLoading,
            isDisabled: isDisabled
        )
    }
    
    // Ghost button with text only
    static func ghost(
        _ title: String,
        action: @escaping () -> Void,
        size: ButtonSize = .large,
        isLoading: Bool = false,
        isDisabled: Bool = false
    ) -> CustomButton {
        CustomButton(
            title: title,
            action: action,
            variant: .ghost,
            size: size,
            isLoading: isLoading,
            isDisabled: isDisabled
        )
    }
    
    // Danger button with text only
    static func danger(
        _ title: String,
        action: @escaping () -> Void,
        size: ButtonSize = .large,
        isLoading: Bool = false,
        isDisabled: Bool = false
    ) -> CustomButton {
        CustomButton(
            title: title,
            action: action,
            variant: .danger,
            size: size,
            isLoading: isLoading,
            isDisabled: isDisabled
        )
    }
}

// MARK: - Previews

#Preview("Button Variants") {
    PreviewWrapper {
        VStack(spacing: 16) {
            CustomButton.primary("Primary Button") { }
            CustomButton.secondary("Secondary Button") { }
            CustomButton.ghost("Ghost Button") { }
            CustomButton.danger("Danger Button") { }
            
            CustomButton(
                title: "Tertiary Button",
                action: { },
                variant: .tertiary
            )
            
            CustomButton.primary("Loading Button", action: { }, isLoading: true)
            CustomButton.secondary("Disabled Button", action: { }, isDisabled: true)
        }
        .padding()
    }
}

#Preview("Button Sizes") {
    PreviewWrapper {
        VStack(spacing: 16) {
            CustomButton(
                title: "Small Button",
                action: { },
                variant: .primary,
                size: .small
            )
            
            CustomButton(
                title: "Medium Button",
                action: { },
                variant: .primary,
                size: .medium
            )
            
            CustomButton(
                title: "Large Button",
                action: { },
                variant: .primary,
                size: .large
            )
        }
        .padding()
    }
}
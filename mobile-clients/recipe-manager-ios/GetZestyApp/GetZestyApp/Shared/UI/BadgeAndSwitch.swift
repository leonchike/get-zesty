//
//  BadgeAndSwitch.swift
//  GetZestyApp
//
//  Badge and Switch components matching React Native app design
//

import SwiftUI

// MARK: - Badge Component

struct Badge: View {
    let text: String
    var variant: BadgeVariant = .default
    var size: BadgeSize = .medium
    
    var body: some View {
        Text(text)
            .font(textFont)
            .fontWeight(.medium)
            .foregroundColor(textColor)
            .padding(.horizontal, horizontalPadding)
            .padding(.vertical, verticalPadding)
            .background(backgroundColor)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(borderColor, lineWidth: borderWidth)
            )
            .cornerRadius(cornerRadius)
    }
    
    // MARK: - Computed Properties
    
    private var backgroundColor: Color {
        switch variant {
        case .default:
            return .brandPrimary.opacity(0.1)
        case .secondary:
            return Color(.systemGray5)
        case .destructive:
            return .red.opacity(0.1)
        case .outline:
            return .clear
        }
    }
    
    private var textColor: Color {
        switch variant {
        case .default:
            return .brandPrimary
        case .secondary:
            return .secondary
        case .destructive:
            return .red
        case .outline:
            return .primaryText
        }
    }
    
    private var borderColor: Color {
        switch variant {
        case .default, .secondary, .destructive:
            return .clear
        case .outline:
            return Color(.systemGray4)
        }
    }
    
    private var borderWidth: CGFloat {
        variant == .outline ? 1 : 0
    }
    
    private var textFont: Font {
        switch size {
        case .small:
            return .system(size: 12)
        case .medium:
            return .system(size: 14)
        case .large:
            return .system(size: 16)
        }
    }
    
    private var horizontalPadding: CGFloat {
        switch size {
        case .small:
            return 8
        case .medium:
            return 12
        case .large:
            return 16
        }
    }
    
    private var verticalPadding: CGFloat {
        switch size {
        case .small:
            return 4
        case .medium:
            return 6
        case .large:
            return 8
        }
    }
    
    private var cornerRadius: CGFloat {
        switch size {
        case .small:
            return 12
        case .medium:
            return 14
        case .large:
            return 16
        }
    }
}

// MARK: - Badge Variants

enum BadgeVariant {
    case `default`      // Brand color background
    case secondary      // Gray background
    case destructive    // Red background for warnings/errors
    case outline        // Transparent background with border
}

enum BadgeSize {
    case small
    case medium
    case large
}

// MARK: - Switch Component

struct SwitchInput: View {
    let title: String?
    let onLabel: String
    let offLabel: String
    @Binding var isOn: Bool
    
    var labelPosition: SwitchLabelPosition = .trailing
    
    @Environment(\.colorScheme) private var colorScheme
    
    init(
        title: String? = nil,
        onLabel: String = "Public",
        offLabel: String = "Private",
        isOn: Binding<Bool>,
        labelPosition: SwitchLabelPosition = .trailing
    ) {
        self.title = title
        self.onLabel = onLabel
        self.offLabel = offLabel
        self._isOn = isOn
        self.labelPosition = labelPosition
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Title label
            if let title = title {
                Text(title)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(Color(UIColor.label))
            }
            
            // Switch with labels
            HStack {
                if labelPosition == .leading {
                    statusLabel
                    Spacer()
                }
                
                Toggle("", isOn: $isOn)
                    .toggleStyle(CustomToggleStyle())
                    .labelsHidden()
                
                if labelPosition == .trailing {
                    Spacer()
                    statusLabel
                }
            }
        }
    }
    
    private var statusLabel: some View {
        Text(isOn ? onLabel : offLabel)
            .font(.system(size: 16, weight: .medium))
            .foregroundColor(isOn ? .brandPrimary : .secondary)
            .animation(.easeInOut(duration: 0.2), value: isOn)
    }
}

// MARK: - Custom Toggle Style

struct CustomToggleStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack {
            RoundedRectangle(cornerRadius: 16)
                .fill(configuration.isOn ? .brandPrimary : Color(.systemGray4))
                .frame(width: 51, height: 31)
                .overlay(
                    Circle()
                        .fill(Color.white)
                        .frame(width: 27, height: 27)
                        .offset(x: configuration.isOn ? 10 : -10)
                        .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
                )
                .onTapGesture {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        configuration.isOn.toggle()
                    }
                }
                .animation(.easeInOut(duration: 0.2), value: configuration.isOn)
        }
    }
}

// MARK: - Switch Label Position

enum SwitchLabelPosition {
    case leading
    case trailing
}

// MARK: - Checkbox Component

struct Checkbox: View {
    @Binding var isChecked: Bool
    let label: String?
    
    var size: CheckboxSize = .medium
    var variant: CheckboxVariant = .default
    
    var body: some View {
        HStack(spacing: 12) {
            Button(action: {
                withAnimation(.easeInOut(duration: 0.15)) {
                    isChecked.toggle()
                }
            }) {
                ZStack {
                    Circle()
                        .fill(backgroundColor)
                        .frame(width: checkboxSize, height: checkboxSize)
                        .overlay(
                            Circle()
                                .stroke(borderColor, lineWidth: borderWidth)
                        )
                    
                    if isChecked {
                        Image(systemName: "checkmark")
                            .font(.system(size: iconSize, weight: .semibold))
                            .foregroundColor(iconColor)
                    }
                }
            }
            .buttonStyle(PlainButtonStyle())
            
            if let label = label {
                Text(label)
                    .font(.system(size: textSize))
                    .foregroundColor(Color(UIColor.label))
                    .onTapGesture {
                        withAnimation(.easeInOut(duration: 0.15)) {
                            isChecked.toggle()
                        }
                    }
            }
        }
    }
    
    // MARK: - Computed Properties
    
    private var backgroundColor: Color {
        if isChecked {
            switch variant {
            case .default:
                return .brandPrimary
            case .secondary:
                return Color(.systemGray)
            }
        } else {
            return .clear
        }
    }
    
    private var borderColor: Color {
        if isChecked {
            switch variant {
            case .default:
                return .brandPrimary
            case .secondary:
                return Color(.systemGray)
            }
        } else {
            return Color(.systemGray4)
        }
    }
    
    private var borderWidth: CGFloat {
        isChecked ? 0 : 1.5
    }
    
    private var iconColor: Color {
        .white
    }
    
    private var checkboxSize: CGFloat {
        switch size {
        case .small:
            return 16
        case .medium:
            return 20
        case .large:
            return 24
        }
    }
    
    private var iconSize: CGFloat {
        switch size {
        case .small:
            return 10
        case .medium:
            return 12
        case .large:
            return 14
        }
    }
    
    private var textSize: CGFloat {
        switch size {
        case .small:
            return 14
        case .medium:
            return 16
        case .large:
            return 18
        }
    }
}

// MARK: - Checkbox Types

enum CheckboxSize {
    case small
    case medium
    case large
}

enum CheckboxVariant {
    case `default`
    case secondary
}

// MARK: - Convenience Initializers

extension Badge {
    static func `default`(_ text: String) -> Badge {
        Badge(text: text, variant: .default)
    }
    
    static func secondary(_ text: String) -> Badge {
        Badge(text: text, variant: .secondary)
    }
    
    static func destructive(_ text: String) -> Badge {
        Badge(text: text, variant: .destructive)
    }
    
    static func outline(_ text: String) -> Badge {
        Badge(text: text, variant: .outline)
    }
}

extension SwitchInput {
    static func publicPrivate(isOn: Binding<Bool>) -> SwitchInput {
        SwitchInput(
            onLabel: "Public",
            offLabel: "Private",
            isOn: isOn
        )
    }
    
    static func enabledDisabled(title: String, isOn: Binding<Bool>) -> SwitchInput {
        SwitchInput(
            title: title,
            onLabel: "Enabled",
            offLabel: "Disabled",
            isOn: isOn
        )
    }
}

// MARK: - Previews

#Preview("Badges") {
    PreviewWrapper {
        VStack(spacing: 16) {
            HStack(spacing: 12) {
                Badge.default("Default")
                Badge.secondary("Secondary")
                Badge.destructive("Error")
                Badge.outline("Outline")
            }
            
            HStack(spacing: 12) {
                Badge(text: "Small", variant: .default, size: .small)
                Badge(text: "Medium", variant: .default, size: .medium)
                Badge(text: "Large", variant: .default, size: .large)
            }
            
            HStack(spacing: 12) {
                Badge.default("Breakfast")
                Badge.default("Quick & Easy")
                Badge.secondary("30 min")
            }
        }
        .padding()
    }
}

#Preview("Switches and Checkboxes") {
    PreviewWrapper {
        VStack(spacing: 24) {
            SwitchInput.publicPrivate(isOn: .constant(true))
            
            SwitchInput.enabledDisabled(
                title: "Notifications",
                isOn: .constant(false)
            )
            
            SwitchInput(
                title: "Recipe Visibility",
                onLabel: "Everyone",
                offLabel: "Just Me",
                isOn: .constant(true),
                labelPosition: .leading
            )
            
            Divider()
            
            VStack(alignment: .leading, spacing: 12) {
                Text("Ingredients")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.primaryText)
                
                Checkbox(isChecked: .constant(true), label: "2 cups flour")
                Checkbox(isChecked: .constant(false), label: "1 tsp salt")
                Checkbox(isChecked: .constant(true), label: "1/2 cup butter")
            }
        }
        .padding()
    }
}
//
//  InputField.swift
//  GetZestyApp
//
//  Reusable input field components matching React Native app design
//

import SwiftUI

struct InputField: View {
    let title: String?
    let placeholder: String
    @Binding var text: String
    
    var keyboardType: UIKeyboardType = .default
    var isSecure: Bool = false
    var cornerRadius: CornerRadiusStyle = .default
    var isMultiline: Bool = false
    var minHeight: CGFloat = 50
    var maxHeight: CGFloat? = nil
    
    @FocusState private var isFocused: Bool
    @Environment(\.colorScheme) private var colorScheme
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Title label
            if let title = title {
                Text(title)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.primaryText)
            }
            
            // Input field
            Group {
                if isMultiline {
                    MultilineTextField(
                        placeholder: placeholder,
                        text: $text,
                        minHeight: minHeight,
                        maxHeight: maxHeight ?? UIScreen.main.bounds.height * 0.8
                    )
                    .focused($isFocused)
                } else if isSecure {
                    SecureField(placeholder, text: $text)
                        .textFieldStyle(CustomTextFieldStyle(
                            isFocused: isFocused,
                            cornerRadius: cornerRadius
                        ))
                        .focused($isFocused)
                } else {
                    TextField(placeholder, text: $text)
                        .keyboardType(keyboardType)
                        .textFieldStyle(CustomTextFieldStyle(
                            isFocused: isFocused,
                            cornerRadius: cornerRadius
                        ))
                        .focused($isFocused)
                }
            }
        }
    }
}

// MARK: - Multiline Text Field

struct MultilineTextField: View {
    let placeholder: String
    @Binding var text: String
    let minHeight: CGFloat
    let maxHeight: CGFloat
    
    @Environment(\.colorScheme) private var colorScheme
    
    var body: some View {
        ZStack(alignment: .topLeading) {
            // Background
            RoundedRectangle(cornerRadius: 16)
                .fill(backgroundColor)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(borderColor, lineWidth: 1)
                )
            
            // Placeholder
            if text.isEmpty {
                Text(placeholder)
                    .foregroundColor(.secondary)
                    .font(.system(size: 16))
                    .padding(.horizontal, 16)
                    .padding(.top, 16)
                    .allowsHitTesting(false)
            }
            
            // Text Editor
            TextEditor(text: $text)
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.primaryText)
                .padding(.horizontal, 12)
                .padding(.vertical, 12)
                .scrollContentBackground(.hidden)
                .background(Color.clear)
        }
        .frame(minHeight: minHeight)
        .frame(maxHeight: maxHeight)
    }
    
    private var backgroundColor: Color {
        colorScheme == .dark ? Color(.systemGray6) : Color(.systemGray6)
    }
    
    private var borderColor: Color {
        Color(.systemGray4)
    }
}

// MARK: - Custom Text Field Style

struct CustomTextFieldStyle: TextFieldStyle {
    let isFocused: Bool
    let cornerRadius: CornerRadiusStyle
    
    @Environment(\.colorScheme) private var colorScheme
    
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .font(.system(size: 16, weight: .semibold))
            .foregroundColor(.primaryText)
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            .background(backgroundColor)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadiusValue)
                    .stroke(borderColor, lineWidth: 1)
            )
            .cornerRadius(cornerRadiusValue)
    }
    
    private var backgroundColor: Color {
        colorScheme == .dark ? Color(.systemGray6) : Color(.systemGray6)
    }
    
    private var borderColor: Color {
        if isFocused {
            return .brandPrimary
        } else {
            return Color(.systemGray4)
        }
    }
    
    private var cornerRadiusValue: CGFloat {
        switch cornerRadius {
        case .default:
            return 16
        case .full:
            return 25
        }
    }
}

// MARK: - Supporting Types

enum CornerRadiusStyle {
    case `default`  // rounded-2xl equivalent
    case full       // rounded-full equivalent
}

// MARK: - Convenience Initializers

extension InputField {
    // Standard text input
    static func text(
        title: String? = nil,
        placeholder: String,
        text: Binding<String>,
        keyboardType: UIKeyboardType = .default
    ) -> InputField {
        InputField(
            title: title,
            placeholder: placeholder,
            text: text,
            keyboardType: keyboardType
        )
    }
    
    // Email input
    static func email(
        title: String? = nil,
        placeholder: String = "Email",
        text: Binding<String>
    ) -> InputField {
        InputField(
            title: title,
            placeholder: placeholder,
            text: text,
            keyboardType: .emailAddress
        )
    }
    
    // Password input
    static func password(
        title: String? = nil,
        placeholder: String = "Password",
        text: Binding<String>
    ) -> InputField {
        InputField(
            title: title,
            placeholder: placeholder,
            text: text,
            isSecure: true
        )
    }
    
    // Multiline text input
    static func multiline(
        title: String? = nil,
        placeholder: String,
        text: Binding<String>,
        minHeight: CGFloat = 120,
        maxHeight: CGFloat? = nil
    ) -> InputField {
        InputField(
            title: title,
            placeholder: placeholder,
            text: text,
            isMultiline: true,
            minHeight: minHeight,
            maxHeight: maxHeight
        )
    }
    
    // Number input
    static func number(
        title: String? = nil,
        placeholder: String,
        text: Binding<String>
    ) -> InputField {
        InputField(
            title: title,
            placeholder: placeholder,
            text: text,
            keyboardType: .numberPad
        )
    }
}

// MARK: - Time Input Component

struct TimeInputField: View {
    let title: String?
    let placeholder: String
    @Binding var timeInMinutes: Int
    
    @State private var timeText: String = ""
    @FocusState private var isFocused: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let title = title {
                Text(title)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.primaryText)
            }
            
            TextField(placeholder, text: $timeText)
                .keyboardType(.numberPad)
                .textFieldStyle(CustomTextFieldStyle(
                    isFocused: isFocused,
                    cornerRadius: .default
                ))
                .focused($isFocused)
                .onChange(of: timeText) { _, newValue in
                    formatTimeInput(newValue)
                }
                .onAppear {
                    if timeInMinutes > 0 {
                        timeText = formatMinutesToTimeString(timeInMinutes)
                    }
                }
        }
    }
    
    private func formatTimeInput(_ input: String) {
        // Remove non-numeric characters
        let digitsOnly = input.filter { $0.isNumber }
        
        // Limit to 4 digits (HHMM)
        let limitedDigits = String(digitsOnly.prefix(4))
        
        // Format as HH:MM
        if limitedDigits.count <= 2 {
            timeText = limitedDigits
        } else {
            let hours = String(limitedDigits.prefix(2))
            let minutes = String(limitedDigits.dropFirst(2))
            timeText = "\(hours):\(minutes)"
        }
        
        // Convert to minutes
        timeInMinutes = parseTimeStringToMinutes(timeText)
    }
    
    private func parseTimeStringToMinutes(_ timeString: String) -> Int {
        let components = timeString.components(separatedBy: ":")
        
        if components.count == 2,
           let hours = Int(components[0]),
           let minutes = Int(components[1]) {
            return (hours * 60) + minutes
        } else if let singleNumber = Int(timeString.replacingOccurrences(of: ":", with: "")) {
            // Handle cases like "30" -> 30 minutes, "130" -> 1:30
            if singleNumber < 60 {
                return singleNumber
            } else {
                let hours = singleNumber / 100
                let minutes = singleNumber % 100
                return (hours * 60) + minutes
            }
        }
        
        return 0
    }
    
    private func formatMinutesToTimeString(_ minutes: Int) -> String {
        let hours = minutes / 60
        let mins = minutes % 60
        return String(format: "%d:%02d", hours, mins)
    }
}

// MARK: - Previews

#Preview("Input Field Variants") {
    PreviewWrapper {
        ScrollView {
            VStack(spacing: 24) {
                InputField.text(
                    title: "Name",
                    placeholder: "Enter your name",
                    text: .constant("")
                )
                
                InputField.email(
                    title: "Email Address",
                    text: .constant("")
                )
                
                InputField.password(
                    title: "Password",
                    text: .constant("")
                )
                
                InputField.number(
                    title: "Phone Number",
                    placeholder: "Enter phone number",
                    text: .constant("")
                )
                
                InputField.multiline(
                    title: "Description",
                    placeholder: "Enter a description...",
                    text: .constant(""),
                    minHeight: 120
                )
                
                TimeInputField(
                    title: "Cooking Time",
                    placeholder: "0:00",
                    timeInMinutes: .constant(45)
                )
            }
            .padding()
        }
    }
}

#Preview("Input Field States") {
    PreviewWrapper {
        VStack(spacing: 24) {
            InputField.text(
                title: "Empty Field",
                placeholder: "Placeholder text",
                text: .constant("")
            )
            
            InputField.text(
                title: "Filled Field",
                placeholder: "Placeholder text",
                text: .constant("Some text content")
            )
            
            InputField(
                title: "Full Corner Radius",
                placeholder: "Rounded input",
                text: .constant(""),
                cornerRadius: .full
            )
        }
        .padding()
    }
}

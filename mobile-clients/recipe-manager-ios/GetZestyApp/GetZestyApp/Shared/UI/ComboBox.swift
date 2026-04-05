//
//  ComboBox.swift
//  GetZestyApp
//
//  Dropdown selector with search functionality matching React Native app
//

import SwiftUI

struct ComboBox<T: Hashable>: View {
    let title: String?
    let placeholder: String
    let options: [ComboBoxOption<T>]
    @Binding var selectedValue: T?
    
    var isSearchable: Bool = true
    var cornerRadius: CornerRadiusStyle = .default
    
    @State private var isPresented = false
    @State private var searchText = ""
    @FocusState private var isSearchFocused: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Title label
            if let title = title {
                Text(title)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.primaryText)
            }
            
            // Selection Button
            Button(action: {
                isPresented = true
            }) {
                HStack {
                    Text(selectedOption?.label ?? placeholder)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(selectedOption != nil ? .primaryText : .secondary)
                    
                    Spacer()
                    
                    Image(systemName: "chevron.down")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.secondary)
                        .rotationEffect(.degrees(isPresented ? 180 : 0))
                        .animation(.easeInOut(duration: 0.2), value: isPresented)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 16)
                .background(backgroundColor)
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadiusValue)
                        .stroke(borderColor, lineWidth: 1)
                )
                .cornerRadius(cornerRadiusValue)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .sheet(isPresented: $isPresented) {
            ComboBoxSheet(
                title: title ?? placeholder,
                options: options,
                selectedValue: $selectedValue,
                isSearchable: isSearchable,
                onDismiss: {
                    isPresented = false
                }
            )
            .presentationDetents([.fraction(0.6), .large])
            .presentationDragIndicator(.visible)
        }
    }
    
    private var selectedOption: ComboBoxOption<T>? {
        options.first { $0.value == selectedValue }
    }
    
    private var backgroundColor: Color {
        Color(.systemGray6)
    }
    
    private var borderColor: Color {
        Color(.systemGray4)
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

// MARK: - ComboBox Option

struct ComboBoxOption<T: Hashable>: Identifiable, Hashable {
    let id = UUID()
    let value: T
    let label: String
    
    init(value: T, label: String) {
        self.value = value
        self.label = label
    }
    
    static func == (lhs: ComboBoxOption<T>, rhs: ComboBoxOption<T>) -> Bool {
        lhs.value == rhs.value
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(value)
    }
}

// MARK: - ComboBox Sheet

struct ComboBoxSheet<T: Hashable>: View {
    let title: String
    let options: [ComboBoxOption<T>]
    @Binding var selectedValue: T?
    let isSearchable: Bool
    let onDismiss: () -> Void
    
    @State private var searchText = ""
    @FocusState private var isSearchFocused: Bool
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search bar (if searchable)
                if isSearchable {
                    VStack(spacing: 0) {
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(.secondary)
                                .font(.system(size: 16))
                            
                            TextField("Search...", text: $searchText)
                                .font(.system(size: 16))
                                .focused($isSearchFocused)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                        .padding(.horizontal, 16)
                        .padding(.bottom, 16)
                        
                        Divider()
                    }
                }
                
                // Options list
                List {
                    ForEach(filteredOptions) { option in
                        Button(action: {
                            selectedValue = option.value
                            onDismiss()
                            dismiss()
                        }) {
                            HStack {
                                Text(option.label)
                                    .font(.system(size: 16))
                                    .foregroundColor(.primaryText)
                                
                                Spacer()
                                
                                if option.value == selectedValue {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 16, weight: .semibold))
                                        .foregroundColor(.brandPrimary)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .listStyle(PlainListStyle())
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                trailing: Button("Done") {
                    onDismiss()
                    dismiss()
                }
            )
        }
        .onAppear {
            if isSearchable {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    isSearchFocused = true
                }
            }
        }
    }
    
    private var filteredOptions: [ComboBoxOption<T>] {
        if searchText.isEmpty {
            return options
        } else {
            return options.filter { option in
                option.label.localizedCaseInsensitiveContains(searchText)
            }
        }
    }
}

// MARK: - Simple Picker (PopupPicker equivalent)

struct PopupPicker<T: Hashable>: View {
    let title: String?
    let placeholder: String
    let options: [ComboBoxOption<T>]
    @Binding var selectedValue: T?
    
    @State private var isPresented = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Title label
            if let title = title {
                Text(title)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.primaryText)
            }
            
            // Selection Button
            Button(action: {
                isPresented = true
            }) {
                HStack {
                    Text(selectedOption?.label ?? placeholder)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(selectedOption != nil ? .primaryText : .secondary)
                    
                    Spacer()
                    
                    Image(systemName: "chevron.down")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 16)
                .background(Color(.systemGray6))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color(.systemGray4), lineWidth: 1)
                )
                .cornerRadius(16)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .sheet(isPresented: $isPresented) {
            PopupPickerSheet(
                title: title ?? placeholder,
                options: options,
                selectedValue: $selectedValue,
                onDismiss: {
                    isPresented = false
                }
            )
            .presentationDetents([.fraction(0.4), .medium])
            .presentationDragIndicator(.visible)
        }
    }
    
    private var selectedOption: ComboBoxOption<T>? {
        options.first { $0.value == selectedValue }
    }
}

// MARK: - PopupPicker Sheet

struct PopupPickerSheet<T: Hashable>: View {
    let title: String
    let options: [ComboBoxOption<T>]
    @Binding var selectedValue: T?
    let onDismiss: () -> Void
    
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text(title)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.primaryText)
                
                Spacer()
                
                Button("Done") {
                    onDismiss()
                    dismiss()
                }
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.brandPrimary)
            }
            .padding(.horizontal, 16)
            .padding(.top, 20)
            .padding(.bottom, 16)
            
            Divider()
            
            // Options list
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(options) { option in
                        Button(action: {
                            selectedValue = option.value
                            onDismiss()
                            dismiss()
                        }) {
                            HStack {
                                Text(option.label)
                                    .font(.system(size: 16))
                                    .foregroundColor(.primaryText)
                                
                                Spacer()
                                
                                if option.value == selectedValue {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 16, weight: .semibold))
                                        .foregroundColor(.brandPrimary)
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 16)
                        }
                        .buttonStyle(PlainButtonStyle())
                        
                        if option.id != options.last?.id {
                            Divider()
                                .padding(.leading, 16)
                        }
                    }
                }
            }
        }
        .background(Color(.systemBackground))
    }
}

// MARK: - Convenience Extensions

extension ComboBoxOption where T == String {
    init(_ value: String) {
        self.value = value
        self.label = value
    }
}

extension ComboBoxOption where T == Int {
    init(value: Int, label: String) {
        self.value = value
        self.label = label
    }
}

// MARK: - Previews

#Preview("ComboBox") {
    PreviewWrapper {
        VStack(spacing: 24) {
            ComboBox(
                title: "Category",
                placeholder: "Select a category",
                options: [
                    ComboBoxOption(value: "breakfast", label: "Breakfast"),
                    ComboBoxOption(value: "lunch", label: "Lunch"),
                    ComboBoxOption(value: "dinner", label: "Dinner"),
                    ComboBoxOption(value: "dessert", label: "Dessert"),
                    ComboBoxOption(value: "snack", label: "Snack")
                ],
                selectedValue: .constant("lunch")
            )
            
            PopupPicker(
                title: "Difficulty",
                placeholder: "Select difficulty",
                options: [
                    ComboBoxOption(value: 1, label: "Easy"),
                    ComboBoxOption(value: 2, label: "Medium"),
                    ComboBoxOption(value: 3, label: "Hard")
                ],
                selectedValue: .constant(2)
            )
        }
        .padding()
    }
}
//
//  SwipeableGroceryRow.swift
//  GetZestyApp
//
//  Swipeable grocery item row matching React Native design
//

import SwiftUI

struct SwipeableGroceryRow: View {
    let item: GroceryItem
    let onToggle: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        HStack(spacing: AppSpacing.sm) {
            // Checkbox
            Button(action: onToggle) {
                Image(systemName: item.isCompleted ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(item.isCompleted ? .brandPrimary : .inputBorder)
                    .font(.title3)
            }
            .buttonStyle(.plain)
            
            // Item content
            VStack(alignment: .leading, spacing: AppSpacing.xxs) {
                Text(item.name ?? "")
                    .font(AppTypography.body())
                    .foregroundColor(item.isCompleted ? .secondaryText : .primaryText)
                    .strikethrough(item.isCompleted)
                
                let displayQuantity = item.displayQuantity
                if !displayQuantity.isEmpty && displayQuantity != "1" {
                    Text(displayQuantity)
                        .font(AppTypography.caption())
                        .foregroundColor(.secondaryText)
                }
            }
            
            Spacer()
            
            // Sync status (subtle)
            if item.isDirty {
                Image(systemName: "arrow.clockwise")
                    .font(.caption2)
                    .foregroundColor(.brandSecondary)
                    .opacity(0.6)
            }
        }
        .padding(.vertical, AppSpacing.xs)
        .contentShape(Rectangle())
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            // Delete (red, far right)
            Button(role: .destructive, action: onDelete) {
                Label("Delete", systemImage: "trash")
            }
            
            // Edit (gray, next to delete)
            Button(action: onEdit) {
                Label("Edit", systemImage: "pencil")
            }
            .tint(.gray)
        }
    }
}

// MARK: - Simple Row for Completed Items
struct SimpleGroceryRow: View {
    let item: GroceryItem
    let onToggle: () -> Void
    
    var body: some View {
        HStack(spacing: AppSpacing.sm) {
            // Checkbox
            Button(action: onToggle) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.brandPrimary)
                    .font(.title3)
            }
            .buttonStyle(.plain)
            
            // Item content (simplified for completed items)
            Text(item.name ?? "")
                .font(AppTypography.body())
                .foregroundColor(.secondaryText)
                .strikethrough(true)
            
            Spacer()
        }
        .padding(.vertical, AppSpacing.xs)
    }
}

// MARK: - Edit Sheet (simple form)
struct EditGrocerySheet: View {
    @ObservedObject var viewModel: GroceryListViewModel
    let editingItem: GroceryItem?
    
    @State private var itemName = ""
    @State private var itemQuantity = ""
    @Environment(\.dismiss) private var dismiss
    @FocusState private var isNameFieldFocused: Bool
    
    private var title: String {
        editingItem != nil ? "Edit Item" : "Add Item"
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: AppSpacing.lg) {
                VStack(spacing: AppSpacing.md) {
                    // Item Name
                    VStack(alignment: .leading, spacing: AppSpacing.xs) {
                        Text("Item Name")
                            .font(AppTypography.callout(.medium))
                            .foregroundColor(.primaryText)
                        
                        TextField("Enter item name", text: $itemName)
                            .textFieldStyle(.plain)
                            .padding(AppSpacing.sm)
                            .background(Color.inputBackground)
                            .cornerRadius(AppRadius.sm)
                            .overlay(
                                RoundedRectangle(cornerRadius: AppRadius.sm)
                                    .stroke(Color.inputBorder, lineWidth: 1)
                            )
                            .focused($isNameFieldFocused)
                    }
                    
                    // Quantity (simple text input)
                    VStack(alignment: .leading, spacing: AppSpacing.xs) {
                        Text("Quantity (optional)")
                            .font(AppTypography.callout(.medium))
                            .foregroundColor(.primaryText)
                        
                        TextField("e.g., 2 lbs, 1 bag", text: $itemQuantity)
                            .textFieldStyle(.plain)
                            .padding(AppSpacing.sm)
                            .background(Color.inputBackground)
                            .cornerRadius(AppRadius.sm)
                            .overlay(
                                RoundedRectangle(cornerRadius: AppRadius.sm)
                                    .stroke(Color.inputBorder, lineWidth: 1)
                            )
                    }
                }
                
                Spacer()
                
                // Save button
                CustomButton.primary("Save Changes") {
                    saveChanges()
                }
                .disabled(itemName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .padding(AppSpacing.lg)
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            setupForEditing()
        }
    }
    
    private func setupForEditing() {
        if let item = editingItem {
            itemName = item.name ?? ""
            itemQuantity = item.displayQuantity != "1" ? (item.displayQuantity) : ""
        }
        isNameFieldFocused = true
    }
    
    private func saveChanges() {
        let trimmedName = itemName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedName.isEmpty else { return }
        
        if let item = editingItem {
            // Parse quantity from string (backend will handle this properly)
            let quantity = parseQuantityFromString(itemQuantity)
            viewModel.updateItem(item, name: trimmedName, quantity: quantity, unit: nil)
        }
        
        dismiss()
    }
    
    private func parseQuantityFromString(_ text: String) -> Double {
        // Simple parsing - extract first number from string
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return 1.0 }
        
        let scanner = Scanner(string: trimmed)
        var value: Double = 1.0
        scanner.scanDouble(&value)
        return max(value, 0.1) // Minimum quantity
    }
}

#Preview("Swipeable Row") {
    List {
        SwipeableGroceryRow(
            item: {
                let item = GroceryItem(context: PersistenceController.preview.container.viewContext)
                item.id = "1"
                item.name = "Organic Apples"
                item.quantity = 3
                item.quantityUnit = "lbs"
                item.status = "ACTIVE"
                return item
            }(),
            onToggle: {},
            onEdit: {},
            onDelete: {}
        )
        
        SwipeableGroceryRow(
            item: {
                let item = GroceryItem(context: PersistenceController.preview.container.viewContext)
                item.id = "2"
                item.name = "Milk"
                item.quantity = 1
                item.status = "COMPLETED"
                return item
            }(),
            onToggle: {},
            onEdit: {},
            onDelete: {}
        )
    }
    .listStyle(.plain)
}
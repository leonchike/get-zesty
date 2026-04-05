//
//  GroceryItemRow.swift
//  GetZestyApp
//
//  Individual grocery item row with checkbox and swipe actions
//

import SwiftUI

struct GroceryItemRow: View {
    let item: GroceryItem
    let onToggle: () -> Void
    let onEdit: (GroceryItem) -> Void
    let onDelete: (GroceryItem) -> Void
    
    @State private var isPressed = false
    
    var body: some View {
        HStack(spacing: AppSpacing.sm) {
            // Checkbox
            CheckboxButton(
                isChecked: item.isCompleted,
                onToggle: onToggle
            )
            
            // Item Content
            VStack(alignment: .leading, spacing: AppSpacing.xxs) {
                HStack {
                    Text(item.name ?? "")
                        .font(AppTypography.body())
                        .foregroundColor(item.isCompleted ? .secondaryText : .primaryText)
                        .strikethrough(item.isCompleted)
                    
                    Spacer()
                    
                    let displayQuantity = item.displayQuantity
                    if !displayQuantity.isEmpty {
                        Text(displayQuantity)
                            .font(AppTypography.callout())
                            .foregroundColor(.secondaryText)
                    }
                }
                
                // Recipe indicator (if from recipe)
                if let recipeId = item.recipeId, !recipeId.isEmpty {
                    HStack(spacing: AppSpacing.xxs) {
                        Image(systemName: "book.fill")
                            .font(.caption2)
                        Text("From recipe")
                            .font(AppTypography.caption())
                    }
                    .foregroundColor(.brandSecondary)
                }
            }
            
            // Sync status indicator
            SyncStatusIndicator(item: item)
        }
        .padding(.vertical, AppSpacing.xs)
        .padding(.horizontal, AppSpacing.sm)
        .background(
            RoundedRectangle(cornerRadius: AppRadius.sm)
                .fill(isPressed ? Color.surfaceSecondary : Color.clear)
        )
        .scaleEffect(isPressed ? 0.98 : 1.0)
        .animation(.easeInOut(duration: 0.1), value: isPressed)
        .onTapGesture {
            withAnimation(.easeInOut(duration: 0.2)) {
                onToggle()
            }
        }
        .onLongPressGesture(
            minimumDuration: 0,
            maximumDistance: .infinity,
            pressing: { pressing in
                isPressed = pressing
            },
            perform: {}
        )
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            // Delete action
            Button(role: .destructive) {
                onDelete(item)
            } label: {
                Label("Delete", systemImage: "trash")
            }
            
            // Edit action
            Button {
                onEdit(item)
            } label: {
                Label("Edit", systemImage: "pencil")
            }
            .tint(.brandSecondary)
        }
        .contextMenu {
            Button {
                onEdit(item)
            } label: {
                Label("Edit", systemImage: "pencil")
            }
            
            Button(role: .destructive) {
                onDelete(item)
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
    }
}

// MARK: - Checkbox Button
struct CheckboxButton: View {
    let isChecked: Bool
    let onToggle: () -> Void
    
    var body: some View {
        Button(action: onToggle) {
            ZStack {
                Circle()
                    .fill(isChecked ? Color.brandPrimary : Color.clear)
                    .frame(width: 24, height: 24)
                
                Circle()
                    .stroke(isChecked ? Color.brandPrimary : Color.inputBorder, lineWidth: 2)
                    .frame(width: 24, height: 24)
                
                if isChecked {
                    Image(systemName: "checkmark")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                }
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Sync Status Indicator
struct SyncStatusIndicator: View {
    let item: GroceryItem
    
    var body: some View {
        Group {
            if item.isDirty {
                Image(systemName: "arrow.clockwise")
                    .font(.caption2)
                    .foregroundColor(.brandSecondary)
                    .rotationEffect(.degrees(item.isDirty ? 360 : 0))
                    .animation(.linear(duration: 2).repeatForever(autoreverses: false), value: item.isDirty)
            } else if let lastSynced = item.lastSyncedAt {
                Image(systemName: "checkmark.circle.fill")
                    .font(.caption2)
                    .foregroundColor(.success)
                    .opacity(shouldShowSyncStatus(lastSynced) ? 1 : 0)
            }
        }
    }
    
    private func shouldShowSyncStatus(_ date: Date) -> Bool {
        Date().timeIntervalSince(date) < 10 // Show for 10 seconds after sync
    }
}

// MARK: - Section View


// MARK: - Preview
#Preview("Grocery Item Row") {
    VStack(spacing: AppSpacing.md) {
        // Active item
        GroceryItemRow(
            item: {
                let item = GroceryItem(context: PersistenceController.preview.container.viewContext)
                item.id = "1"
                item.name = "Organic Apples"
                item.quantity = 3
                item.quantityUnit = "lbs"
                item.status = "ACTIVE"
                item.isDirty = false
                return item
            }(),
            onToggle: {},
            onEdit: { _ in },
            onDelete: { _ in }
        )
        
        // Completed item
        GroceryItemRow(
            item: {
                let item = GroceryItem(context: PersistenceController.preview.container.viewContext)
                item.id = "2"
                item.name = "Whole Milk"
                item.quantity = 1
                item.quantityUnit = "gallon"
                item.status = "COMPLETED"
                item.isDirty = true
                return item
            }(),
            onToggle: {},
            onEdit: { _ in },
            onDelete: { _ in }
        )
        
        // Recipe item
        GroceryItemRow(
            item: {
                let item = GroceryItem(context: PersistenceController.preview.container.viewContext)
                item.id = "3"
                item.name = "Chicken Breast"
                item.quantity = 2
                item.quantityUnit = "lbs"
                item.status = "ACTIVE"
                item.recipeId = "recipe-123"
                item.isDirty = false
                item.lastSyncedAt = Date()
                return item
            }(),
            onToggle: {},
            onEdit: { _ in },
            onDelete: { _ in }
        )
    }
    .padding()
    .background(Color.backgroundPrimary)
}

#Preview("Grocery Section") {
    struct PreviewWrapper: View {
        var body: some View {
            let sectionData = GroceryListViewModel.SectionDisplayData(name: "Fresh Produce")
            
            let items: [GroceryItem] = [
                {
                    let item = GroceryItem(context: PersistenceController.preview.container.viewContext)
                    item.id = "1"
                    item.name = "Organic Apples"
                    item.quantity = 3
                    item.quantityUnit = "lbs"
                    item.status = "ACTIVE"
                    return item
                }(),
                {
                    let item = GroceryItem(context: PersistenceController.preview.container.viewContext)
                    item.id = "2"
                    item.name = "Baby Spinach"
                    item.quantity = 1
                    item.quantityUnit = "bag"
                    item.status = "ACTIVE"
                    return item
                }()
            ]
            
            return GrocerySectionView(
                section: sectionData,
                items: items,
                onToggle: { _ in },
                onEdit: { _ in },
                onDelete: { _ in }
            )
            .padding()
            .background(Color.backgroundPrimary)
        }
    }
    
    return PreviewWrapper()
}
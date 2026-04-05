//
//  GroceryListView.swift
//  GetZestyApp
//
//  Simple grocery list matching React Native design
//

import SwiftUI
import CoreData

struct GroceryListView: View {
    @StateObject private var viewModel: GroceryListViewModel
    @State private var newItemText = ""
    @FocusState private var isInputFocused: Bool
    
    init() {
        let syncService = GrocerySyncService(
            apiClient: APIClient.shared,
            coreDataManager: PersistenceController.shared
        )
        
        _viewModel = StateObject(wrappedValue: GroceryListViewModel(
            viewContext: PersistenceController.shared.container.viewContext,
            grocerySyncService: syncService
        ))
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Simple Add Input (matching RN design)
            AddGroceryInput(
                text: $newItemText,
                isCreating: viewModel.isCreatingItem,
                onSubmit: {
                    addNewItem()
                }
            )
            .focused($isInputFocused)
            .padding(.horizontal, AppSpacing.md)
            .padding(.vertical, AppSpacing.sm)
            
            // Grocery List or Empty State
            if viewModel.activeItems.isEmpty && viewModel.completedItems.isEmpty {
                EmptyGroceryState()
            } else {
                GroceryListContent(viewModel: viewModel)
            }
        }
        .navigationBarHidden(true)
        .safeAreaInset(edge: .top) {
            PageHeader(title: "Groceries")
        }
        .background(Color.backgroundPrimary)
        .sheet(isPresented: $viewModel.showAddItem) {
            EditGrocerySheet(
                viewModel: viewModel,
                editingItem: viewModel.selectedItem
            )
        }
        .alert("Error", isPresented: .constant(viewModel.errorMessage != nil)) {
            Button("OK") {
                viewModel.dismissError()
            }
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
    }
    
    private func addNewItem() {
        let trimmedText = newItemText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedText.isEmpty else { return }
        
        Task {
            await viewModel.addItem(name: trimmedText)
            if viewModel.errorMessage == nil {
                newItemText = ""
                isInputFocused = true
            }
        }
    }
}

// MARK: - Simple Add Input (matching RN design)
struct AddGroceryInput: View {
    @Binding var text: String
    let isCreating: Bool
    let onSubmit: () -> Void
    
    var body: some View {
        HStack(spacing: AppSpacing.sm) {
            InputField(
                title: nil,
                placeholder: "Add grocery item...",
                text: $text
            )
                .textFieldStyle(.plain)
                .font(AppTypography.body())
                .onSubmit {
                    onSubmit()
                }
                .disabled(isCreating)
            
            if isCreating {
                ProgressView()
                    .scaleEffect(0.8)
            }
        }
    }
}

// MARK: - Empty State (simple message only)
struct EmptyGroceryState: View {
    var body: some View {
        VStack(spacing: AppSpacing.lg) {
            Spacer()
            
            Text("Your grocery list is empty")
                .font(AppTypography.headline())
                .foregroundColor(.secondaryText)
                .multilineTextAlignment(.center)
            
            Text("Add items above to get started")
                .font(AppTypography.body())
                .foregroundColor(.tertiaryText)
                .multilineTextAlignment(.center)
            
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Grocery List Content (React Native SectionList Style)
struct GroceryListContent: View {
    @ObservedObject var viewModel: GroceryListViewModel
    @State private var showCompleted = false
        
    var body: some View {
        List {
            ForEach(viewModel.groupedActiveItems, id: \.0.id) { section, items in
                GrocerySectionView(
                    section: section,
                    items: items,
                    onToggle: { item in viewModel.toggleItemCompletion(item) },
                    onEdit: { item in viewModel.showEditItemSheet(for: item) },
                    onDelete: { item in viewModel.deleteItem(item) }
                )
            }
            
            if !viewModel.completedItems.isEmpty {
                Section {
                    if showCompleted {
                        ForEach(viewModel.completedItems, id: \.id) { item in
                            SimpleGroceryRow(
                                item: item,
                                onToggle: { viewModel.toggleItemCompletion(item) }
                            )
                            .listRowInsets(EdgeInsets(top: 0, leading: AppSpacing.md, bottom: 0, trailing: AppSpacing.md))
                            .listRowSeparator(.visible)
                            .listRowBackground(Color.backgroundPrimary)
                        }
                    }
                } header: {
                    CustomCompletedSectionHeader(
                        itemCount: viewModel.completedItems.count,
                        isExpanded: showCompleted,
                        onToggle: {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                showCompleted.toggle()
                            }
                        }
                    )
                    .listRowInsets(EdgeInsets())
                }
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .background(Color.backgroundPrimary)
        .refreshable {
            await viewModel.refreshData()
        }
    }
}

#Preview("Grocery List with Sections") {
    NavigationStack {
        GroceryListView()
            .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
            .environmentObject(AuthenticationManager())
            .environmentObject(AppCoordinator())
    }
}

// MARK: - Custom Section Headers (matching React Native style)
struct CustomSectionHeader: View {
    let title: String
    let emoji: String
    let itemCount: Int
    
    var body: some View {
        HStack(spacing: AppSpacing.sm) {
            // Large emoji (matching RN text-3xl/text-4xl)
            if !emoji.isEmpty {
                Text(emoji)
                    .font(.system(size: 24))
            }
            
            // Section title
            Text(title)
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.primaryText.opacity(0.7))
            
            Spacer()
        }
        .padding(.horizontal, AppSpacing.md)
        .padding(.vertical, AppSpacing.xs)
        .background(Color.backgroundPrimary)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct CustomCompletedSectionHeader: View {
    let itemCount: Int
    let isExpanded: Bool
    let onToggle: () -> Void
    
    var body: some View {
        Button(action: onToggle) {
            HStack(spacing: AppSpacing.sm) {
                // Section title
                Text("Completed")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.primaryText.opacity(0.7))
                
                Spacer()
                
                // Show/Hide toggle
                Text(isExpanded ? "Hide" : "Show")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.primaryText)
            }
            .padding(.horizontal, AppSpacing.md)
            .padding(.vertical, AppSpacing.sm)
            .background(Color.backgroundPrimary)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview("Empty Grocery List") {
    EmptyGroceryState()
}

#Preview("CustomSectionHeader - Light Mode") {
    VStack(spacing: 20) {
        CustomSectionHeader(
            title: "Produce",
            emoji: "🥬",
            itemCount: 5
        )
        
        CustomSectionHeader(
            title: "Dairy & Eggs",
            emoji: "🥛",
            itemCount: 3
        )
        
        CustomSectionHeader(
            title: "Meat & Seafood",
            emoji: "🥩",
            itemCount: 2
        )
        
        CustomSectionHeader(
            title: "Pantry",
            emoji: "🥫",
            itemCount: 8
        )
    }
    .background(Color.backgroundPrimary)
    .previewDisplayName("Light Mode")
}

#Preview("CustomSectionHeader - Dark Mode") {
    VStack(spacing: 20) {
        CustomSectionHeader(
            title: "Produce",
            emoji: "🥬",
            itemCount: 5
        )
        
        CustomSectionHeader(
            title: "Dairy & Eggs",
            emoji: "🥛",
            itemCount: 3
        )
        
        CustomSectionHeader(
            title: "Meat & Seafood",
            emoji: "🥩",
            itemCount: 2
        )
        
        CustomSectionHeader(
            title: "Pantry",
            emoji: "🥫",
            itemCount: 8
        )
    }
    .background(Color.backgroundPrimary)
    .preferredColorScheme(.dark)
    .previewDisplayName("Dark Mode")
}

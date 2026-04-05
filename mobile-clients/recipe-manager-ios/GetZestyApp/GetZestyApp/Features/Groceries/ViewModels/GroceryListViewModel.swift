//
//  GroceryListViewModel.swift
//  GetZestyApp
//
//  ViewModel for managing grocery list with Core Data integration
//

import Foundation
import SwiftUI
import CoreData
import Combine

@MainActor
class GroceryListViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var grocerySections: [GrocerySection] = []
    @Published var activeItems: [GroceryItem] = []
    @Published var completedItems: [GroceryItem] = []
    @Published var searchText = ""
    @Published var isLoading = false
    @Published var isCreatingItem = false
    @Published var errorMessage: String?
    @Published var showAddItem = false
    @Published var selectedItem: GroceryItem?
    @Published var showDeleteConfirmation = false
    @Published var isSyncing = false
    @Published var lastSyncTime: Date?
    
    // MARK: - Filtered Items
    var filteredActiveItems: [GroceryItem] {
        if searchText.isEmpty {
            return activeItems
        } else {
            return activeItems.filter { item in
                item.name?.localizedCaseInsensitiveContains(searchText) == true
            }
        }
    }
    
    var filteredCompletedItems: [GroceryItem] {
        if searchText.isEmpty {
            return completedItems
        } else {
            return completedItems.filter { item in
                item.name?.localizedCaseInsensitiveContains(searchText) == true
            }
        }
    }
    
    // MARK: - Section Display Data (React Native approach)
    struct SectionDisplayData: Identifiable {
        let id: String
        let name: String
        let emoji: String
        let sortOrder: Int32
        
        init(name: String) {
            self.id = name
            self.name = name
            self.emoji = GrocerySection.getSectionEmoji(name) ?? "📦"
            self.sortOrder = GrocerySection.getSortOrder(for: name)
        }
    }
    
    // MARK: - In-Memory Categorization (after Core Data fetch)
    var groupedActiveItems: [(SectionDisplayData, [GroceryItem])] {
        print("GroceryListViewModel: Starting in-memory categorization for \(filteredActiveItems.count) items")
        print("GroceryListViewModel: Section mapping contains \(GroceryItem.sectionMapping.count) entries:")
        for (id, section) in GroceryItem.sectionMapping {
            print("  \(id) -> \(section ?? "nil")")
        }
        
        // Group items by looking up their section name from the mapping
        let grouped = Dictionary(grouping: filteredActiveItems) { item in
            guard let itemId = item.id else {
                print("Item has no ID: \(item.name ?? "unknown")")
                return "Other"
            }
            
            let sectionName = GroceryItem.sectionMapping[itemId] ?? "Other"
            print("Item '\(item.name ?? "unknown")' (ID: \(itemId)) -> Section: '\(sectionName)'")
            return sectionName
        }
        
        // Convert to display data and sort (put "Other" last like React Native)
        var result = grouped.map { (sectionName, items) in
            let sectionData = SectionDisplayData(name: sectionName)
            let sortedItems = items.sorted { ($0.createdAt ?? Date()) < ($1.createdAt ?? Date()) }
            return (sectionData, sortedItems)
        }
        
        // Sort sections (Other should be last)
        result.sort { (first, second) in
            if first.0.name == "Other" { return false }
            if second.0.name == "Other" { return true }
            return first.0.sortOrder < second.0.sortOrder
        }
        
        return result.filter { !$0.1.isEmpty }
    }
    
    private func fetchSection(withId sectionId: String) -> GrocerySection? {
        let request: NSFetchRequest<GrocerySection> = GrocerySection.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", sectionId)
        request.fetchLimit = 1
        do {
            return try viewContext.fetch(request).first
        } catch {
            print("Failed to fetch section with id \(sectionId): \(error)")
            return nil
        }
    }
    
    // MARK: - Dependencies
    private let viewContext: NSManagedObjectContext
    private let grocerySyncService: GrocerySyncService
    private var cancellables = Set<AnyCancellable>()
    
    // No longer needed - using React Native approach with "Other" fallback
    
    // MARK: - Initialization
    init(viewContext: NSManagedObjectContext, grocerySyncService: GrocerySyncService) {
        self.viewContext = viewContext
        self.grocerySyncService = grocerySyncService
        
        // Ensure the view context automatically merges changes from parent
        viewContext.automaticallyMergesChangesFromParent = true
        
        setupSubscriptions()
        loadData()
    }
    
    // MARK: - Setup
    private func setupSubscriptions() {
        // Subscribe to sync service status
        grocerySyncService.$isSyncing
            .receive(on: DispatchQueue.main)
            .assign(to: \.isSyncing, on: self)
            .store(in: &cancellables)
        
        grocerySyncService.$lastSyncTime
            .receive(on: DispatchQueue.main)
            .assign(to: \.lastSyncTime, on: self)
            .store(in: &cancellables)
        
        // Listen for Core Data changes
        NotificationCenter.default.publisher(for: .NSManagedObjectContextDidSave)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.loadData()
            }
            .store(in: &cancellables)
    }
    
    // Removed initializeDefaultSections - using React Native approach
    
    // MARK: - Data Loading
    func loadData() {
        print("GroceryListViewModel: loadData() called.")
        do {
            // Load sections
            let sectionRequest = GrocerySection.allSectionsFetchRequest()
            grocerySections = try viewContext.fetch(sectionRequest)
            print("GroceryListViewModel: Loaded \(grocerySections.count) sections.")
            
            // Load active items with relationships
            let activeRequest = GroceryItem.activeFetchRequest()
            activeRequest.relationshipKeyPathsForPrefetching = ["section"]
            activeItems = try viewContext.fetch(activeRequest)
            print("GroceryListViewModel: Loaded \(activeItems.count) active items.")
            
            // Debug: Print section info for each item
            for item in activeItems {
                print("  - Item: \(item.name ?? "Unknown") | SectionID: \(item.sectionId ?? "nil") | Section: \(item.section?.name ?? "nil")")
            }
            
            // Load completed items
            let completedRequest = GroceryItem.completedFetchRequest()
            completedItems = try viewContext.fetch(completedRequest)
            print("GroceryListViewModel: Loaded \(completedItems.count) completed items.")
            
        } catch {
            errorMessage = "Failed to load grocery data: \(error.localizedDescription)"
            print("GroceryListViewModel: Error loading data: \(error.localizedDescription)")
        }
    }
    
    // MARK: - Item Management (Server-Side Creation)
    func addItem(name: String) async {
        guard !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Item name cannot be empty"
            return
        }
        
        isCreatingItem = true
        errorMessage = nil
        
        do {
            // Backend parses the entire string to determine quantity, unit, and section
            let createdItem = try await grocerySyncService.createItem(
                name: name.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            
            // Update Core Data with the server response
            let item = GroceryItem(context: viewContext)
            item.configure(from: createdItem)
            
            // Ensure section relationship is established
            if let sectionId = createdItem.sectionId {
                let sectionRequest: NSFetchRequest<GrocerySection> = GrocerySection.fetchRequest()
                sectionRequest.predicate = NSPredicate(format: "id == %@", sectionId)
                sectionRequest.fetchLimit = 1
                
                if let sections = try? viewContext.fetch(sectionRequest),
                   let section = sections.first {
                    item.section = section
                }
            }
            
            try viewContext.save()
            loadData()
            
        } catch {
            errorMessage = "Failed to add item: \(error.localizedDescription)"
        }
        
        isCreatingItem = false
    }
    
    // MARK: - Item Management (Optimistic Updates)
    func toggleItemCompletion(_ item: GroceryItem) {
        if item.isCompleted {
            item.markAsActive()
        } else {
            item.markAsCompleted()
        }
        
        saveAndSyncOptimistically(item)
    }
    
    func updateItem(_ item: GroceryItem, name: String? = nil, quantity: Double? = nil, unit: String? = nil) {
        item.updateWith(name: name, quantity: quantity, unit: unit)
        saveAndSyncOptimistically(item)
    }
    
    func deleteItem(_ item: GroceryItem) {
        item.softDelete()
        saveAndSyncOptimistically(item)
    }
    
    func moveItem(_ item: GroceryItem, toSectionId sectionId: String) {
        item.sectionId = sectionId
        item.updatedAt = Date()
        item.isDirty = true
        saveAndSyncOptimistically(item)
    }
    
    // MARK: - Bulk Operations
    func clearCompletedItems() {
        let completedItems = self.completedItems
        
        for item in completedItems {
            item.softDelete()
        }
        
        do {
            try viewContext.save()
            loadData()
            
            // Sync deletions to API in background
            Task {
                await grocerySyncService.syncChanges()
            }
        } catch {
            errorMessage = "Failed to clear completed items: \(error.localizedDescription)"
        }
    }
    
    func addItemsFromRecipe(_ recipeId: String, ingredients: [String]) async {
        isCreatingItem = true
        errorMessage = nil
        
        do {
            // Create items on server (which parses and assigns sections)
            for ingredient in ingredients {
                let createdItem = try await grocerySyncService.createItem(
                    name: ingredient,
                    recipeId: recipeId
                )
                
                // Update Core Data with server response
                let item = GroceryItem(context: viewContext)
                item.configure(from: createdItem)
            }
            
            try viewContext.save()
            loadData()
            
        } catch {
            errorMessage = "Failed to add recipe ingredients: \(error.localizedDescription)"
        }
        
        isCreatingItem = false
    }
    
    // MARK: - Sync Operations
    func refreshData() async {
        isLoading = true
        await grocerySyncService.syncChanges()
        loadData()
        isLoading = false
    }
    
    func forceSyncAll() async {
        isSyncing = true
        await grocerySyncService.fullSync()
        loadData()
    }
    
    // MARK: - Helper Methods
    private func saveAndSyncOptimistically(_ item: GroceryItem) {
        do {
            try viewContext.save()
            loadData()
            
            // Sync to API in background
            Task {
                await grocerySyncService.syncItem(withID: item.objectID)
            }
        } catch {
            errorMessage = "Failed to save changes: \(error.localizedDescription)"
        }
    }
    
    // MARK: - UI State Management
    func showAddItemSheet() {
        selectedItem = nil
        showAddItem = true
    }
    
    func showEditItemSheet(for item: GroceryItem) {
        selectedItem = item
        showAddItem = true
    }
    
    func hideAddItemSheet() {
        showAddItem = false
        selectedItem = nil
    }
    
    func confirmDeleteItem(_ item: GroceryItem) {
        selectedItem = item
        showDeleteConfirmation = true
    }
    
    func dismissDeleteConfirmation() {
        showDeleteConfirmation = false
        selectedItem = nil
    }
    
    func dismissError() {
        errorMessage = nil
    }
    
    // MARK: - Statistics
    var totalActiveItems: Int {
        activeItems.count
    }
    
    var totalCompletedItems: Int {
        completedItems.count
    }
    
    var completionPercentage: Double {
        let total = totalActiveItems + totalCompletedItems
        guard total > 0 else { return 0.0 }
        return Double(totalCompletedItems) / Double(total) * 100.0
    }
    
    func itemsInSection(_ section: GrocerySection) -> [GroceryItem] {
        activeItems.filter { $0.sectionId == section.id }
    }
}

// MARK: - Preview Support
extension GroceryListViewModel {
    static func preview(context: NSManagedObjectContext) -> GroceryListViewModel {
        let mockSyncService = GrocerySyncService(
            apiClient: APIClient.shared,
            coreDataManager: PersistenceController.shared
        )
        
        return GroceryListViewModel(
            viewContext: context,
            grocerySyncService: mockSyncService
        )
    }
}
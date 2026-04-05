//
//  GrocerySyncService.swift
//  GetZestyApp
//
//  Service for syncing grocery items with the API
//

import Foundation
import CoreData
import Combine

class GrocerySyncService: ObservableObject {
    @Published var isSyncing = false
    @Published var lastSyncTime: Date?
    @Published var isPolling = false
    
    private let apiClient: APIClient
    private let coreDataManager: PersistenceController
    private var cancellables = Set<AnyCancellable>()
    private var pollingTimer: Timer?
    private var syncTimer: Timer?
    
    init(apiClient: APIClient, coreDataManager: PersistenceController) {
        self.apiClient = apiClient
        self.coreDataManager = coreDataManager
        
        startPolling()
        startPeriodicSync()
    }
    
    deinit {
        pollingTimer?.invalidate()
        syncTimer?.invalidate()
    }
    
    // MARK: - Polling Setup (matching React Native implementation)
    private func startPolling() {
        let pollingInterval = getPollingInterval()
        
        pollingTimer = Timer.scheduledTimer(withTimeInterval: pollingInterval, repeats: true) { [weak self] _ in
            Task { @MainActor in
                await self?.pollForUpdates()
            }
        }
        
        // Initial poll
        Task { @MainActor in
            await pollForUpdates()
        }
    }
    
    private func getPollingInterval() -> TimeInterval {
        #if DEBUG
        // Development: 30 seconds (matching React Native dev interval)
        return 30.0
        #else
        // Production: 3 seconds (matching React Native production interval)
        return 3.0
        #endif
    }
    
    private func pollForUpdates() async {
        guard !isPolling else { return }
        
        isPolling = true
        
        do {
            let serverItems = try await fetchGroceryUpdates()
            await handleGroceryUpdates(serverItems)
        } catch {
            Swift.print("Polling failed: \(error)")
        }
        
        isPolling = false
    }
    
    private func fetchGroceryUpdates() async throws -> [APIGroceryItem] {
        let endpoint = APIEndpoint(
            path: APIRoutes.Grocery.getMobileGroceryUpdates,
            method: .GET
        )
        
        return try await apiClient.request(
            endpoint: endpoint,
            responseType: [APIGroceryItem].self
        )
    }
    
    private func handleGroceryUpdates(_ serverItems: [APIGroceryItem]) async {
        Swift.print("GrocerySyncService: handleGroceryUpdates called with \(serverItems.count) items.")
        
        await withCheckedContinuation { continuation in
            coreDataManager.container.performBackgroundTask { context in
            // Merge server updates with local data (timestamp-based conflict resolution like React Native)
            for apiItem in serverItems {
                Swift.print("GrocerySyncService: Processing API item: \(apiItem.name) (section: \(apiItem.section?.name ?? "N/A"))")
                let fetchRequest: NSFetchRequest<GroceryItem> = GroceryItem.fetchRequest()
                fetchRequest.predicate = NSPredicate(format: "id == %@", apiItem.id)
                fetchRequest.fetchLimit = 1
                
                do {
                    let existingItems = try context.fetch(fetchRequest)
                    
                    if let existingItem = existingItems.first {
                        // Always update section mapping, but only update Core Data fields if timestamp is newer
                        let serverDate = apiItem.updatedAt
                        let localDate = existingItem.updatedAt ?? Date.distantPast
                        
                        if serverDate > localDate && !existingItem.isDirty {
                            existingItem.configure(from: apiItem)
                            Swift.print("handleGroceryUpdates: Updated existing item \(existingItem.name ?? "") with section info")
                        } else {
                            // Even if we don't update Core Data, we still need to update the section mapping
                            if let apiSection = apiItem.section {
                                GroceryItem.sectionMapping[apiItem.id] = apiSection.name
                                Swift.print("handleGroceryUpdates: Updated section mapping for existing item \(existingItem.name ?? "") -> \(apiSection.name)")
                            }
                        }
                    } else {
                        // Add new item from server
                        let newItem = GroceryItem(context: context)
                        newItem.configure(from: apiItem)
                        Swift.print("handleGroceryUpdates: Created new item \(newItem.name ?? "") with section: \(newItem.section?.name ?? "N/A")")
                    }
                } catch {
                    Swift.print("Error handling grocery update: \(error)")
                }
            }
            
            do {
                try context.save()
                Swift.print("GrocerySyncService: Background context saved successfully in handleGroceryUpdates.")
                
                // Resume the continuation on successful save
                continuation.resume()

            } catch {
                Swift.print("GrocerySyncService: Error saving background context in handleGroceryUpdates: \(error)")
                continuation.resume()
            }
            }
        }
        
        // Refresh objects on main actor after background operation completes
        await MainActor.run {
            self.coreDataManager.container.viewContext.refreshAllObjects()
            Swift.print("GrocerySyncService: Refreshed all objects in main viewContext.")
        }
        
        await MainActor.run {
            lastSyncTime = Date()
        }
    }
    
    // MARK: - Item Creation (Server-Side)
    func createItem(
        name: String,
        recipeId: String? = nil
    ) async throws -> APIGroceryItem {
        let request = CreateGroceryItemRequest(
            name: name,
            quantity: nil, // Server will parse from name
            quantityUnit: nil, // Server will parse from name
            sectionId: nil, // Server will assign the section
            recipeId: recipeId
        )
        
        let endpoint = APIEndpoint(
            path: APIRoutes.Grocery.updateGroceryItem,
            method: .POST,
            body: CreateGroceryItemPayload(data: request)
        )
        
        let response = try await apiClient.request(
            endpoint: endpoint,
            responseType: APIGroceryItem.self
        )
        
        return response
    }
    
    // MARK: - Item Updates (Background Sync)
    func syncItem(withID itemID: NSManagedObjectID) async {
        let context = coreDataManager.container.newBackgroundContext()
        await context.perform {
            Task {
                guard let item = context.object(with: itemID) as? GroceryItem else {
                    Swift.print("Failed to retrieve item for sync")
                    return
                }
                
                guard item.needsSync else { return }
                
                do {
                    if item.isMarkedForDeletion {
                        try await self.deleteItemOnServer(item)
                        context.delete(item)
                    } else {
                        try await self.updateItemOnServer(item)
                        item.isDirty = false
                        item.lastSyncedAt = Date()
                    }
                    
                    try context.save()
                } catch {
                    Swift.print("Failed to sync item \(item.name ?? ""): \(error)")
                    // Item remains dirty for retry
                }
            }
        }
    }
    
    private func updateItemOnServer(_ item: GroceryItem) async throws {
        guard let itemId = item.id else { return }
        
        let updateData = UpdateGroceryItemRequest(
            id: itemId,
            name: item.name,
            quantity: item.quantity,
            quantityUnit: item.quantityUnit,
            status: item.status,
            sectionId: item.sectionId
        )
        
        let payload = UpdateGroceryItemPayload(data: updateData)
        
        let endpoint = APIEndpoint(
            path: APIRoutes.Grocery.updateGroceryItem,
            method: .PATCH,
            body: payload
        )
        
        let _: APIGroceryItem = try await apiClient.request(
            endpoint: endpoint,
            responseType: APIGroceryItem.self
        )
    }
    
    private func deleteItemOnServer(_ item: GroceryItem) async throws {
        guard let itemId = item.id else { return }
        
        let endpoint = APIEndpoint(
            path: "\(APIRoutes.Grocery.getUserGroceries)/\(itemId)",
            method: .DELETE
        )
        
        let _: EmptyResponse = try await apiClient.request(endpoint: endpoint, responseType: EmptyResponse.self)
        
        // Removal from Core Data is now handled in the syncItem method's background context
    }
    
    // MARK: - Bulk Sync Operations
    func syncChanges() async {
        guard !isSyncing else { return }
        
        await MainActor.run {
            isSyncing = true
        }
        
        do {
            // Get all dirty items
            let dirtyItems = try await fetchDirtyItems()
            
            // Sync each dirty item by its ID
            for item in dirtyItems {
                await syncItem(withID: item.objectID)
            }
            
            // Update last sync time
            await MainActor.run {
                lastSyncTime = Date()
            }
        } catch {
            Swift.print("Sync failed: \(error)")
        }
        
        await MainActor.run {
            isSyncing = false
        }
    }
    
    func fullSync() async {
        guard !isSyncing else { return }
        
        await MainActor.run {
            isSyncing = true
        }
        
        do {
            // First sync local changes
            await syncChanges()
            
            // Then fetch latest from server
            let serverItems = try await fetchAllGroceryItems()
            await updateLocalItems(with: serverItems)
            
            await MainActor.run {
                lastSyncTime = Date()
            }
        } catch {
            print("Full sync failed: \(error)")
        }
        
        await MainActor.run {
            isSyncing = false
        }
    }
    
    // MARK: - Server Fetching
    private func fetchAllGroceryItems() async throws -> [APIGroceryItem] {
        let endpoint = APIEndpoint(
            path: APIRoutes.Grocery.getUserGroceries,
            method: .GET
        )
        
        return try await apiClient.request(
            endpoint: endpoint,
            responseType: [APIGroceryItem].self
        )
    }
    
    private func updateLocalItems(with serverItems: [APIGroceryItem]) async {
        print("GrocerySyncService: updateLocalItems called with \(serverItems.count) items.")
        
        await withCheckedContinuation { continuation in
            coreDataManager.container.performBackgroundTask { context in
            for apiItem in serverItems {
                print("GrocerySyncService: Processing API item in updateLocalItems: \(apiItem.name) (section: \(apiItem.section?.name ?? "N/A"))")
                // Find existing item or create new
                let fetchRequest: NSFetchRequest<GroceryItem> = GroceryItem.fetchRequest()
                fetchRequest.predicate = NSPredicate(format: "id == %@", apiItem.id)
                fetchRequest.fetchLimit = 1
                
                do {
                    let existingItems = try context.fetch(fetchRequest)
                    let item = existingItems.first ?? GroceryItem(context: context)
                    
                    // Use timestamp-based comparison instead of serverVersion
                    let shouldUpdate = existingItems.isEmpty || // New item
                        (apiItem.updatedAt > (item.updatedAt ?? Date.distantPast) && !item.isDirty)
                    
                    if shouldUpdate {
                        item.configure(from: apiItem)
                        print("updateLocalItems: Updated item \(item.name ?? "") with section: \(item.section?.name ?? "N/A")")
                    }
                } catch {
                    Swift.print("Error updating local item: \(error)")
                }
            }
            
            do {
                try context.save()
                Swift.print("GrocerySyncService: Background context saved successfully in updateLocalItems.")
                continuation.resume()
            } catch {
                Swift.print("GrocerySyncService: Error saving background context in updateLocalItems: \(error)")
                continuation.resume()
            }
            }
        }
        
        // Refresh all objects in the main viewContext after background operation completes
        await MainActor.run {
            self.coreDataManager.container.viewContext.refreshAllObjects()
            Swift.print("GrocerySyncService: Refreshed all objects in main viewContext after updateLocalItems.")
        } 
    }
    
    // MARK: - Core Data Helpers
    private func fetchDirtyItems() async throws -> [GroceryItem] {
        return try await withCheckedThrowingContinuation { continuation in
            coreDataManager.container.performBackgroundTask { context in
                do {
                    let request = GroceryItem.dirtyFetchRequest()
                    let items = try context.fetch(request)
                    continuation.resume(returning: items)
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }
    
    // MARK: - Periodic Sync (for dirty items)
    private func startPeriodicSync() {
        // Sync dirty items every 30 seconds (more frequent since we poll for updates every 3s)
        syncTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { _ in
            Task { @MainActor in
                await self.syncChanges()
            }
        }
    }
    
    // MARK: - Polling Control (for background/foreground optimization)
    func pausePolling() {
        pollingTimer?.invalidate()
        pollingTimer = nil
    }
    
    func resumePolling() {
        guard pollingTimer == nil else { return }
        startPolling()
    }
}



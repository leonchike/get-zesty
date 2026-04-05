//
//  GroceryItem+CoreDataExtensions.swift
//  GetZestyApp
//
//  Core Data extensions for GroceryItem entity
//

import Foundation
import CoreData

// MARK: - GroceryItem Status Enum
enum GroceryItemStatus: String, CaseIterable {
    case active = "ACTIVE"
    case completed = "COMPLETED"
    case deleted = "DELETED"
    
    var displayName: String {
        switch self {
        case .active: return "Active"
        case .completed: return "Completed"
        case .deleted: return "Deleted"
        }
    }
}

// MARK: - GroceryItem Extensions
extension GroceryItem {
    
    // MARK: - Convenience Properties
    var statusEnum: GroceryItemStatus {
        get {
            return GroceryItemStatus(rawValue: status ?? "ACTIVE") ?? .active
        }
        set {
            status = newValue.rawValue
            updatedAt = Date()
            isDirty = true
        }
    }
    
    var isActive: Bool {
        statusEnum == .active
    }
    
    var isCompleted: Bool {
        statusEnum == .completed
    }
    
    var displayQuantity: String {
        let formatter = NumberFormatter()
        formatter.maximumFractionDigits = 2
        formatter.minimumFractionDigits = 0
        
        let quantityString = formatter.string(from: NSNumber(value: quantity)) ?? "1"
        
        if let unit = quantityUnit, !unit.isEmpty {
            return "\(quantityString) \(unit)"
        } else {
            return quantityString
        }
    }
    
    var needsSync: Bool {
        isDirty && !isMarkedForDeletion
    }
    
    // MARK: - Simple section name storage
    static var sectionMapping: [String: String] = [:]  // itemId -> sectionName
    
    // MARK: - Factory Methods
    static func create(
        in context: NSManagedObjectContext,
        name: String,
        quantity: Double = 1.0,
        unit: String? = nil,
        sectionId: String? = nil,
        recipeId: String? = nil
    ) -> GroceryItem {
        let item = GroceryItem(context: context)
        item.id = UUID().uuidString
        item.name = name
        item.quantity = quantity
        item.quantityUnit = unit
        item.sectionId = sectionId
        item.recipeId = recipeId
        item.status = GroceryItemStatus.active.rawValue
        item.createdAt = Date()
        item.updatedAt = Date()
        item.isDirty = true
        item.isMarkedForDeletion = false
        item.serverVersion = 0
        
        return item
    }
    
    // MARK: - Update Methods
    func updateWith(name: String? = nil, quantity: Double? = nil, unit: String? = nil) {
        if let name = name {
            self.name = name
        }
        if let quantity = quantity {
            self.quantity = quantity
        }
        if let unit = unit {
            self.quantityUnit = unit
        }
        
        self.updatedAt = Date()
        self.isDirty = true
    }
    
    func markAsCompleted() {
        statusEnum = .completed
    }
    
    func markAsActive() {
        statusEnum = .active
    }
    
    func softDelete() {
        isMarkedForDeletion = true
        statusEnum = .deleted
    }
    
    func markAsSynced(serverVersion: Int32) {
        isDirty = false
        lastSyncedAt = Date()
        self.serverVersion = serverVersion
    }
    
    // MARK: - API Conversion
    func toAPIModel() -> APIGroceryItem {
        return APIGroceryItem(
            id: id ?? UUID().uuidString,
            name: name ?? "",
            quantity: quantity,
            quantityUnit: quantityUnit,
            sectionId: sectionId,
            recipeId: recipeId,
            status: status ?? "ACTIVE",
            createdAt: createdAt ?? Date(),
            updatedAt: updatedAt ?? Date(),
            section: section?.toAPIModel()
        )
    }
    
    func configure(from apiItem: APIGroceryItem) {
        print("GroceryItem.configure: Starting configuration for item '\(apiItem.name)'")
        
        self.id = apiItem.id
        self.name = apiItem.name
        self.quantity = apiItem.quantity ?? 1.0
        self.quantityUnit = apiItem.quantityUnit
        self.sectionId = apiItem.sectionId
        self.recipeId = apiItem.recipeId
        self.status = apiItem.status
        self.createdAt = apiItem.createdAt
        self.updatedAt = apiItem.updatedAt
        
        // Store section name mapping for easy lookup later
        if let apiSection = apiItem.section {
            GroceryItem.sectionMapping[apiItem.id] = apiSection.name
            print("GroceryItem.configure: Mapped item '\(apiItem.name)' to section '\(apiSection.name)'")
        } else {
            GroceryItem.sectionMapping[apiItem.id] = nil
            print("GroceryItem.configure: No section for item '\(apiItem.name)'")
        }
        
        self.isDirty = false
        self.isMarkedForDeletion = false
        self.lastSyncedAt = Date()
    }
}

// MARK: - Fetch Requests
extension GroceryItem {
    
    static func activeFetchRequest() -> NSFetchRequest<GroceryItem> {
        let request = fetchRequest()
        request.predicate = NSPredicate(format: "status == %@ AND isMarkedForDeletion == NO", "ACTIVE")
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \GroceryItem.createdAt, ascending: false)
        ]
        return request
    }
    
    static func completedFetchRequest() -> NSFetchRequest<GroceryItem> {
        let request = fetchRequest()
        request.predicate = NSPredicate(format: "status == %@ AND isMarkedForDeletion == NO", "COMPLETED")
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \GroceryItem.updatedAt, ascending: false)
        ]
        return request
    }
    
    static func dirtyFetchRequest() -> NSFetchRequest<GroceryItem> {
        let request = fetchRequest()
        request.predicate = NSPredicate(format: "isDirty == YES")
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \GroceryItem.updatedAt, ascending: true)
        ]
        return request
    }
    
    static func fetchRequest(for recipeId: String) -> NSFetchRequest<GroceryItem> {
        let request = fetchRequest()
        request.predicate = NSPredicate(format: "recipeId == %@ AND isMarkedForDeletion == NO", recipeId)
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \GroceryItem.createdAt, ascending: true)
        ]
        return request
    }
}


//
//  PersistenceController.swift
//  GetZestyApp
//
//  Core Data stack for Recipe Manager
//

import CoreData
import Foundation

struct PersistenceController {
    static let shared = PersistenceController()
    
    // MARK: - Preview Context
    static var preview: PersistenceController = {
        let result = PersistenceController(inMemory: true)
        let viewContext = result.container.viewContext
        
        // Create sample data for previews
        createSampleData(in: viewContext)
        
        return result
    }()
    
    // MARK: - Core Data Container
    let container: NSPersistentContainer
    
    // MARK: - Initialization
    init(inMemory: Bool = false) {
        container = NSPersistentContainer(name: "RecipeManager")
        
        if inMemory {
            container.persistentStoreDescriptions.first!.url = URL(fileURLWithPath: "/dev/null")
        } else {
            // Configure persistent store for production
            let storeDescription = container.persistentStoreDescriptions.first!
            storeDescription.type = NSSQLiteStoreType
            storeDescription.setOption(true as NSNumber, forKey: NSPersistentHistoryTrackingKey)
            storeDescription.setOption(true as NSNumber, forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)
        }
        
        container.loadPersistentStores { _, error in
            if let error = error as NSError? {
                // In production, handle this error appropriately
                // For now, we'll use fatalError for debugging
                fatalError("Core Data error: \(error), \(error.userInfo)")
            }
        }
        
        // Configure view context
        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        
        // Enable persistent history tracking
        container.viewContext.name = "viewContext"
        container.viewContext.transactionAuthor = "app"
    }
    
    // MARK: - Core Data Operations
    func save() {
        let context = container.viewContext
        
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                print("Core Data save error: \(error)")
            }
        }
    }
    
    func saveContext() async {
        await container.viewContext.perform {
            self.save()
        }
    }
    
    func performBackgroundTask<T>(_ block: @escaping (NSManagedObjectContext) -> T) async -> T {
        return await withCheckedContinuation { continuation in
            container.performBackgroundTask { context in
                let result = block(context)
                
                if context.hasChanges {
                    do {
                        try context.save()
                    } catch {
                        print("Background save error: \(error)")
                    }
                }
                
                continuation.resume(returning: result)
            }
        }
    }
    
    // MARK: - Batch Operations
    func deleteAllData() async {
        let entities = ["GroceryItem", "GrocerySection", "Recipe"]
        
        for entityName in entities {
            await performBackgroundTask { context in
                let fetchRequest = NSFetchRequest<NSFetchRequestResult>(entityName: entityName)
                let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)
                
                do {
                    try context.execute(deleteRequest)
                } catch {
                    print("Failed to delete \(entityName): \(error)")
                }
            }
        }
    }
    
    // MARK: - Sample Data Creation
    private static func createSampleData(in context: NSManagedObjectContext) {
        // Create sample grocery sections
        let sections = [
            ("Fresh Produce", "🥬"),
            ("Dairy & Eggs", "🥛"),
            ("Meat & Seafood", "🍗"),
            ("Pantry", "🥫"),
            ("Beverages", "🥤")
        ]
        
        var sectionEntities: [GrocerySection] = []
        
        for (name, emoji) in sections {
            let section = GrocerySection(context: context)
            section.id = UUID().uuidString
            section.name = name
            section.emoji = emoji
            section.sortOrder = Int32(sections.firstIndex { $0.0 == name } ?? 0)
            sectionEntities.append(section)
        }
        
        // Create sample grocery items
        let sampleItems = [
            ("Bananas", "Fresh Produce", 6.0, "pieces"),
            ("Milk", "Dairy & Eggs", 1.0, "gallon"),
            ("Chicken Breast", "Meat & Seafood", 2.0, "lbs"),
            ("Rice", "Pantry", 1.0, "bag"),
            ("Orange Juice", "Beverages", 1.0, "bottle")
        ]
        
        for (name, sectionName, quantity, unit) in sampleItems {
            let item = GroceryItem(context: context)
            item.id = UUID().uuidString
            item.name = name
            item.quantity = quantity
            item.quantityUnit = unit
            item.status = GroceryItemStatus.active.rawValue
            item.createdAt = Date()
            item.updatedAt = Date()
            item.isDirty = false
            item.isMarkedForDeletion = false
            item.serverVersion = 1
            
            // Find and assign section
            if let section = sectionEntities.first(where: { $0.name == sectionName }) {
                item.section = section
                item.sectionId = section.id
            }
        }
        
        do {
            try context.save()
        } catch {
            print("Failed to save sample data: \(error)")
        }
    }
}
//
//  GrocerySection+CoreDataExtensions.swift
//  GetZestyApp
//
//  Core Data extensions for GrocerySection entity
//

import Foundation
import CoreData

// MARK: - GrocerySection Extensions
extension GrocerySection {
    
    // MARK: - Convenience Properties
    var itemsArray: [GroceryItem] {
        let set = items as? Set<GroceryItem> ?? []
        return set.sorted { item1, item2 in
            guard let date1 = item1.createdAt, let date2 = item2.createdAt else {
                return false
            }
            return date1 < date2
        }
    }
    
    var activeItemsArray: [GroceryItem] {
        return itemsArray.filter { $0.isActive }
    }
    
    var completedItemsArray: [GroceryItem] {
        return itemsArray.filter { $0.isCompleted }
    }
    
    var activeItemsCount: Int {
        activeItemsArray.count
    }
    
    var displayName: String {
        if let emoji = emoji, !emoji.isEmpty {
            return "\(emoji) \(name ?? "")"
        } else {
            return name ?? ""
        }
    }
    
    // MARK: - Factory Methods
    static func create(
        in context: NSManagedObjectContext,
        id: String,
        name: String,
        emoji: String? = nil,
        sortOrder: Int32 = 0
    ) -> GrocerySection {
        let section = GrocerySection(context: context)
        section.id = id
        section.name = name
        section.emoji = emoji
        section.sortOrder = sortOrder
        
        return section
    }
    
    // MARK: - API Conversion
    func toAPIModel() -> APIGrocerySection {
        return APIGrocerySection(
            id: id ?? UUID().uuidString,
            name: name ?? "",
            createdAt: createdAt ?? Date(),
            updatedAt: updatedAt ?? Date()
        )
    }
    
    func configure(from apiSection: APIGrocerySection) {
        self.id = apiSection.id
        self.name = apiSection.name
        self.createdAt = apiSection.createdAt
        self.updatedAt = apiSection.updatedAt
        self.emoji = GrocerySection.getSectionEmoji(apiSection.name)
        // If sortOrder is not provided by API, it should retain its default or be set by client logic
        // For now, we'll assume defaultSections handles initial sortOrder.
        // If this section is newly created from API, its sortOrder will be 999 from GroceryItem+CoreDataExtensions
        // If it's an existing section, its sortOrder should already be set.
    }
    
    // MARK: - Client-Side Emoji Mapping
    static func getSectionEmoji(_ sectionName: String) -> String? {
        let emojiMap: [String: String] = [
            "Alcohol": "🍾",
            "Bakery & Bread": "🍞",
            "Baking": "🧁",
            "Beverages": "🥤",
            "Breakfast & Cereal": "🥣",
            "Candy": "🍬",
            "Coffee": "☕",
            "Condiments & Sauces": "🧂",
            "Dairy & Eggs": "🥛",
            "Deli": "🥪",
            "Fresh Produce": "🥬",
            "Frozen": "🧊",
            "Health & Wellness": "💊",
            "Meat & Seafood": "🍗",
            "Pantry": "🥫",
            "Paper & Cleaning Products": "🧻",
            "Personal Care": "🧴",
            "Snacks": "🍿",
            "Spices": "🌶️",
            "Other": "📦",  // React Native uses "Other" not "Uncategorized"
            "Uncategorized": "📦"
        ]
        return emojiMap[sectionName]
    }
    
    // MARK: - Sort Order Mapping
    static func getSortOrder(for sectionName: String) -> Int32 {
        let sortOrderMap: [String: Int32] = [
            "Fresh Produce": 0,
            "Dairy & Eggs": 1,
            "Meat & Seafood": 2,
            "Pantry": 3,
            "Beverages": 4,
            "Bakery & Bread": 5,
            "Frozen": 6,
            "Snacks": 7,
            "Spices": 8,
            "Condiments & Sauces": 9,
            "Breakfast & Cereal": 10,
            "Baking": 11,
            "Candy": 12,
            "Alcohol": 13,
            "Health & Wellness": 14,
            "Personal Care": 15,
            "Paper & Cleaning Products": 16,
            "Paper & Cleaning": 16, // Alternative name
            "Coffee": 17,
            "Deli": 18,
            "Other": 999,  // React Native fallback section
            "Uncategorized": 999
        ]
        return sortOrderMap[sectionName] ?? 999
    }
    
    // MARK: - Default Sections
    static func createDefaultSections(in context: NSManagedObjectContext) {
        let defaultSections = [
            ("fresh-produce", "Fresh Produce", 0),
            ("dairy-eggs", "Dairy & Eggs", 1),
            ("meat-seafood", "Meat & Seafood", 2),
            ("pantry", "Pantry", 3),
            ("beverages", "Beverages", 4),
            ("bakery-bread", "Bakery & Bread", 5),
            ("frozen", "Frozen", 6),
            ("snacks", "Snacks", 7),
            ("spices", "Spices", 8),
            ("condiments", "Condiments & Sauces", 9),
            ("breakfast", "Breakfast & Cereal", 10),
            ("baking", "Baking", 11),
            ("candy", "Candy", 12),
            ("alcohol", "Alcohol", 13),
            ("health", "Health & Wellness", 14),
            ("personal-care", "Personal Care", 15),
            ("paper-cleaning", "Paper & Cleaning", 16)
        ]
        
        for (id, name, sortOrder) in defaultSections {
            let section = GrocerySection.create(
                in: context,
                id: id,
                name: name,
                emoji: GrocerySection.getSectionEmoji(name),
                sortOrder: Int32(sortOrder)
            )
            context.insert(section)
        }
    }
}

// MARK: - Fetch Requests
extension GrocerySection {
    
    static func allSectionsFetchRequest() -> NSFetchRequest<GrocerySection> {
        let request = fetchRequest()
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \GrocerySection.sortOrder, ascending: true),
            NSSortDescriptor(keyPath: \GrocerySection.name, ascending: true)
        ]
        return request
    }
    
    static func sectionsWithItemsFetchRequest() -> NSFetchRequest<GrocerySection> {
        let request = fetchRequest()
        request.predicate = NSPredicate(format: "items.@count > 0")
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \GrocerySection.sortOrder, ascending: true)
        ]
        return request
    }
}



// MARK: - Section Mapping Helper
class GrocerySectionMapper {
    static let shared = GrocerySectionMapper()
    
    private let ingredientToSectionMap: [String: String] = [
        // Fresh Produce
        "apple": "fresh-produce",
        "banana": "fresh-produce",
        "orange": "fresh-produce",
        "lettuce": "fresh-produce",
        "tomato": "fresh-produce",
        "onion": "fresh-produce",
        "garlic": "fresh-produce",
        "carrot": "fresh-produce",
        "potato": "fresh-produce",
        "broccoli": "fresh-produce",
        "spinach": "fresh-produce",
        "avocado": "fresh-produce",
        
        // Dairy & Eggs
        "milk": "dairy-eggs",
        "cheese": "dairy-eggs",
        "butter": "dairy-eggs",
        "yogurt": "dairy-eggs",
        "eggs": "dairy-eggs",
        "cream": "dairy-eggs",
        "sour cream": "dairy-eggs",
        
        // Meat & Seafood
        "chicken": "meat-seafood",
        "beef": "meat-seafood",
        "pork": "meat-seafood",
        "fish": "meat-seafood",
        "salmon": "meat-seafood",
        "shrimp": "meat-seafood",
        "turkey": "meat-seafood",
        "bacon": "meat-seafood",
        
        // Pantry
        "rice": "pantry",
        "pasta": "pantry",
        "beans": "pantry",
        "canned": "pantry",
        "oil": "pantry",
        "vinegar": "pantry",
        "flour": "baking",
        "sugar": "baking",
        
        // Beverages
        "water": "beverages",
        "juice": "beverages",
        "soda": "beverages",
        "coffee": "beverages",
        "tea": "beverages",
        "wine": "alcohol",
        "beer": "alcohol",
        
        // Condiments
        "salt": "condiments",
        "pepper": "spices",
        "ketchup": "condiments",
        "mustard": "condiments",
        "mayo": "condiments",
        "sauce": "condiments"
    ]
    
    func getSectionId(for ingredientName: String) -> String? {
        let lowercased = ingredientName.lowercased()
        
        // Direct match
        if let sectionId = ingredientToSectionMap[lowercased] {
            return sectionId
        }
        
        // Partial match
        for (ingredient, sectionId) in ingredientToSectionMap {
            if lowercased.contains(ingredient) {
                return sectionId
            }
        }
        
        // Default to pantry for unknown items
        return "pantry"
    }
}
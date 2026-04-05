
//
//  APIModels.swift
//  GetZestyApp
//
//  Created by Leon Nwankwo on 26/06/2025.
//

import Foundation

// MARK: - API Grocery Item Models

struct APIGroceryItem: Codable {
    let id: String
    let name: String
    let quantity: Double?
    let quantityUnit: String?
    let sectionId: String?
    let recipeId: String?
    let status: String
    let createdAt: Date
    let updatedAt: Date
    let section: APIGrocerySection? // This matches the API response structure
}

struct APIGrocerySection: Codable {
    let id: String
    let name: String
    let createdAt: Date
    let updatedAt: Date
}

struct CreateGroceryItemRequest: Codable {
    let name: String
    let quantity: Double?
    let quantityUnit: String?
    let sectionId: String?
    let recipeId: String?
}

struct CreateGroceryItemPayload: Codable {
    let data: CreateGroceryItemRequest
}

struct UpdateGroceryItemPayload: Codable {
    let data: UpdateGroceryItemRequest
}

struct UpdateGroceryItemRequest: Codable {
    let id: String
    let name: String?
    let quantity: Double?
    let quantityUnit: String?
    let status: String?
    let sectionId: String?
}

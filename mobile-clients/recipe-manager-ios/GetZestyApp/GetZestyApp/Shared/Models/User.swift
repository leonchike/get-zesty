//
//  User.swift
//  GetZestyApp
//
//  User data model matching API structure
//

import Foundation

struct User: Codable, Identifiable {
    let id: String
    var name: String?
    var firstName: String?
    var lastName: String?
    let email: String
    var emailVerified: Date?
    var image: String?
    let createdAt: Date?
    let updatedAt: Date?
    let isAccountDisabled: Bool?
    
    var displayName: String {
        if let name = name, !name.isEmpty {
            return name
        } else if let firstName = firstName, let lastName = lastName {
            return "\(firstName) \(lastName)".trimmingCharacters(in: .whitespaces)
        } else if let firstName = firstName {
            return firstName
        } else {
            return email
        }
    }
    
    var initials: String {
        let components = displayName.components(separatedBy: .whitespaces)
        let initials = components.compactMap { $0.first?.uppercased() }
        return String(initials.prefix(2).joined())
    }
}

// MARK: - User Update Request
struct UserUpdateRequest: Codable {
    let name: String?
    let firstName: String?
    let lastName: String?
    let image: String?
}

// MARK: - Password Update Request
struct PasswordUpdateRequest: Codable {
    let oldPassword: String
    let newPassword: String
}

// MARK: - Account Deactivation Request
struct AccountDeactivationRequest: Codable {
    let password: String
}

// MARK: - Profile Response
struct ProfileUpdateResponse: Codable {
    let success: Bool
    let message: String?
    let user: User?
}
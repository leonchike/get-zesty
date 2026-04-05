//
//  KeychainManager.swift
//  GetZestyApp
//
//  Secure storage for authentication tokens and sensitive data
//

import Foundation
import Security

class KeychainManager {
    static let shared = KeychainManager()
    
    private let service = "com.getzesty.recipemanager"
    
    private enum KeychainKey: String {
        case authToken = "auth_token"
        case userEmail = "user_email"
        case userId = "user_id"
    }
    
    private init() {}
    
    // MARK: - Auth Token Management
    func saveAuthToken(_ token: String) {
        print("🔐 KeychainManager: Saving auth token")
        save(token, for: .authToken)
        print("🔐 KeychainManager: Auth token saved successfully")
    }
    
    func getAuthToken() -> String? {
        let token = get(.authToken)
        if let token = token {
            print("🔐 KeychainManager: Retrieved auth token (length: \(token.count))")
        } else {
            print("🔐 KeychainManager: No auth token found")
        }
        return token
    }
    
    func deleteAuthToken() {
        delete(.authToken)
    }
    
    // MARK: - User Info Management
    func saveUserEmail(_ email: String) {
        save(email, for: .userEmail)
    }
    
    func getUserEmail() -> String? {
        return get(.userEmail)
    }
    
    func saveUserId(_ userId: String) {
        save(userId, for: .userId)
    }
    
    func getUserId() -> String? {
        return get(.userId)
    }
    
    // MARK: - Clear All Data
    func clearAllData() {
        deleteAuthToken()
        delete(.userEmail)
        delete(.userId)
    }
    
    // MARK: - Private Methods
    private func save(_ value: String, for key: KeychainKey) {
        let data = value.data(using: .utf8)!
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key.rawValue,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        // Delete existing item first
        SecItemDelete(query as CFDictionary)
        
        // Add new item
        let status = SecItemAdd(query as CFDictionary, nil)
        
        if status != errSecSuccess {
            print("Keychain save error for \(key.rawValue): \(status)")
        }
    }
    
    private func get(_ key: KeychainKey) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key.rawValue,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return value
    }
    
    private func delete(_ key: KeychainKey) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key.rawValue
        ]
        
        SecItemDelete(query as CFDictionary)
    }
    
    // MARK: - Token Validation
    func isAuthTokenValid() -> Bool {
        guard let token = getAuthToken() else { return false }
        
        // Parse JWT to check expiration
        let segments = token.components(separatedBy: ".")
        guard segments.count == 3 else { return false }
        
        let payloadSegment = segments[1]
        
        // Add padding if needed for base64 decoding
        var padded = payloadSegment
        let remainder = padded.count % 4
        if remainder > 0 {
            padded += String(repeating: "=", count: 4 - remainder)
        }
        
        guard let data = Data(base64Encoded: padded),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let exp = json["exp"] as? TimeInterval else {
            return false
        }
        
        let expirationDate = Date(timeIntervalSince1970: exp)
        return expirationDate > Date()
    }
}
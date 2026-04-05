//
//  APIClient.swift
//  GetZestyApp
//
//  Centralized API client for Recipe Manager
//

import Foundation
import Combine

@MainActor
class APIClient: ObservableObject {
    // MARK: - Properties
    static let shared = APIClient()
    
    private let session: URLSession
    private let baseURL: URL
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    
    @Published var isOnline = true
    
    // MARK: - Initialization
    init() {
        // Configure base URL based on build configuration
        #if DEBUG
        self.baseURL = URL(string: "https://www.getzesty.food")! // Using production for now
        #else
        self.baseURL = URL(string: "https://www.getzesty.food")!
        #endif
        
        // Configure URL session
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        configuration.waitsForConnectivity = true
        
        self.session = URLSession(configuration: configuration)
        
        // Configure JSON handling
        self.decoder = JSONDecoder()
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        // Custom date decoding to handle backend's ISO8601 format with milliseconds
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
        dateFormatter.timeZone = TimeZone(abbreviation: "UTC")
        self.decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            
            // Try with milliseconds first
            if let date = dateFormatter.date(from: dateString) {
                return date
            }
            
            // Try without milliseconds
            dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'"
            if let date = dateFormatter.date(from: dateString) {
                return date
            }
            
            // Try standard ISO8601
            let isoFormatter = ISO8601DateFormatter()
            isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = isoFormatter.date(from: dateString) {
                return date
            }
            
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date string \(dateString)")
        }
        
        self.encoder = JSONEncoder()
        self.encoder.keyEncodingStrategy = .convertToSnakeCase
        self.encoder.dateEncodingStrategy = .iso8601
    }
    
    // MARK: - Generic Request Method
    func request<T: Codable>(
        endpoint: APIEndpoint,
        responseType: T.Type
    ) async throws -> T {
        let request = try buildURLRequest(for: endpoint)
        
        print("🌐 APIClient: Making \(endpoint.method.rawValue) request to \(request.url?.absoluteString ?? "unknown")")
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                print("❌ APIClient: Invalid response type")
                throw APIError.invalidResponse
            }
            
            print("🌐 APIClient: Response status code: \(httpResponse.statusCode)")
            
            // Log response body for debugging successful responses
            if let responseString = String(data: data, encoding: .utf8) {
                print("✅ APIClient: Response body: \(responseString)")
            }
            
            guard 200...299 ~= httpResponse.statusCode else {
                let errorResponse = try? decoder.decode(APIErrorResponse.self, from: data)
                let errorMessage = errorResponse?.error ?? "Unknown server error"
                print("❌ APIClient: Server error \(httpResponse.statusCode): \(errorMessage)")
                
                // Log response body for debugging
                if let responseString = String(data: data, encoding: .utf8) {
                    print("❌ APIClient: Response body: \(responseString)")
                }
                
                throw APIError.serverError(
                    statusCode: httpResponse.statusCode,
                    message: errorMessage
                )
            }
            
            // Handle empty responses
            if data.isEmpty && T.self == EmptyResponse.self {
                print("✅ APIClient: Empty response received")
                return EmptyResponse() as! T
            }
            
            print("✅ APIClient: Successfully decoded response")
            return try decoder.decode(T.self, from: data)
            
        } catch {
            if error is APIError {
                throw error
            } else {
                print("❌ APIClient: Network error: \(error.localizedDescription)")
                throw APIError.networkError(error)
            }
        }
    }
    
    // MARK: - Request Building
    private func buildURLRequest(for endpoint: APIEndpoint) throws -> URLRequest {
        let url = baseURL.appendingPathComponent(endpoint.path)
        var request = URLRequest(url: url)
        
        request.httpMethod = endpoint.method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authentication header if available
        if let token = KeychainManager.shared.getAuthToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add request body for POST/PUT/PATCH requests
        if let body = endpoint.body {
            request.httpBody = try encoder.encode(body)
        }
        
        // Add query parameters
        if !endpoint.queryParameters.isEmpty {
            var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
            components?.queryItems = endpoint.queryParameters.map { key, value in
                URLQueryItem(name: key, value: "\(value)")
            }
            request.url = components?.url
        }
        
        return request
    }
    
    // MARK: - Upload Methods
    func uploadImage(
        _ imageData: Data,
        to endpoint: APIEndpoint
    ) async throws -> ImageUploadResponse {
        let request = try buildURLRequest(for: endpoint)
        
        let (data, response) = try await session.upload(for: request, from: imageData)
        
        guard let httpResponse = response as? HTTPURLResponse,
              200...299 ~= httpResponse.statusCode else {
            throw APIError.uploadFailed
        }
        
        return try decoder.decode(ImageUploadResponse.self, from: data)
    }
    
    // MARK: - Server-Sent Events
    func createSSEStream(endpoint: APIEndpoint) -> AsyncThrowingStream<SSEEvent, Error> {
        AsyncThrowingStream { continuation in
            Task {
                do {
                    let request = try buildURLRequest(for: endpoint)
                    let (bytes, response) = try await session.bytes(for: request)
                    
                    guard let httpResponse = response as? HTTPURLResponse,
                          httpResponse.statusCode == 200 else {
                        continuation.finish(throwing: APIError.invalidResponse)
                        return
                    }
                    
                    var eventData = ""
                    
                    for try await line in bytes.lines {
                        if line.isEmpty {
                            // End of event, parse and emit
                            if !eventData.isEmpty {
                                if let event = parseSSEEvent(eventData) {
                                    continuation.yield(event)
                                }
                                eventData = ""
                            }
                        } else {
                            eventData += line + "\n"
                        }
                    }
                    
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }
    
    private func parseSSEEvent(_ data: String) -> SSEEvent? {
        let lines = data.components(separatedBy: .newlines)
        var eventType = ""
        var eventData = ""
        
        for line in lines {
            if line.hasPrefix("event: ") {
                eventType = String(line.dropFirst(7))
            } else if line.hasPrefix("data: ") {
                eventData = String(line.dropFirst(6))
            }
        }
        
        guard !eventData.isEmpty else { return nil }
        
        return SSEEvent(type: eventType, data: eventData)
    }
}

// MARK: - Supporting Types
enum HTTPMethod: String {
    case GET = "GET"
    case POST = "POST"
    case PUT = "PUT"
    case PATCH = "PATCH"
    case DELETE = "DELETE"
}

struct APIEndpoint {
    let path: String
    let method: HTTPMethod
    let body: Codable?
    let queryParameters: [String: Any]
    
    init(
        path: String,
        method: HTTPMethod = .GET,
        body: Codable? = nil,
        queryParameters: [String: Any] = [:]
    ) {
        self.path = path
        self.method = method
        self.body = body
        self.queryParameters = queryParameters
    }
}

enum APIError: LocalizedError {
    case invalidResponse
    case networkError(Error)
    case serverError(statusCode: Int, message: String)
    case authenticationRequired
    case uploadFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from server"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .serverError(_, let message):
            return message
        case .authenticationRequired:
            return "Authentication required"
        case .uploadFailed:
            return "Failed to upload file"
        }
    }
}

struct APIErrorResponse: Codable {
    let error: String
    let details: String?
    let status: Int?
}

struct EmptyResponse: Codable {
    init() {}
}

struct ImageUploadResponse: Codable {
    let imageUrl: String
    let cloudflareUrl: String?
}

struct SSEEvent {
    let type: String
    let data: String
}
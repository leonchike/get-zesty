//
//  SSEManager.swift
//  GetZestyApp
//
//  Server-Sent Events manager for real-time updates
//

import Foundation
import Combine

class SSEManager: ObservableObject {
    @Published var isConnected = false
    @Published var connectionStatus: ConnectionStatus = .disconnected
    
    enum ConnectionStatus {
        case disconnected
        case connecting
        case connected
        case error(String)
    }
    
    // Event handlers
    var onGroceryBulkUpdate: (([APIGroceryItem]) -> Void)?
    var onConnectionStatusChange: ((Bool) -> Void)?
    
    private let apiClient: APIClient
    private var eventSource: URLSessionDataTask?
    private var reconnectTimer: Timer?
    private var reconnectAttempts = 0
    private let maxReconnectAttempts = 5
    private let reconnectDelay: TimeInterval = 5.0
    
    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }
    
    deinit {
        disconnect()
    }
    
    // MARK: - Connection Management
    func connect() {
        guard !isConnected else { return }
        
        connectionStatus = .connecting
        reconnectTimer?.invalidate()
        
        Task {
            do {
                let request = try await createSSERequest()
                
                await MainActor.run {
                    self.eventSource = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
                        self?.handleSSEResponse(data: data, response: response, error: error)
                    }
                    
                    self.eventSource?.resume()
                }
            } catch {
                await MainActor.run {
                    self.connectionStatus = .error("Failed to create SSE connection: \(error.localizedDescription)")
                    self.scheduleReconnect()
                }
            }
        }
    }
    
    func disconnect() {
        eventSource?.cancel()
        eventSource = nil
        reconnectTimer?.invalidate()
        reconnectTimer = nil
        
        isConnected = false
        connectionStatus = .disconnected
        reconnectAttempts = 0
        
        onConnectionStatusChange?(false)
    }
    
    private func createSSERequest() async throws -> URLRequest {
        guard let token = KeychainManager.shared.getAuthToken() else {
            throw SSEError.noAuthToken
        }
        
        // Construct URL manually using the same endpoint as Next.js app
        let baseURLString = "https://www.getzesty.food"
        guard let baseURL = URL(string: baseURLString),
              let url = URL(string: "/api/grocery-updates", relativeTo: baseURL) else {
            throw SSEError.invalidURL
        }
        
        var request = URLRequest(url: url)
        
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        request.setValue("no-cache", forHTTPHeaderField: "Cache-Control")
        request.setValue("keep-alive", forHTTPHeaderField: "Connection")
        
        return request
    }
    
    // MARK: - Response Handling
    private func handleSSEResponse(data: Data?, response: URLResponse?, error: Error?) {
        if let error = error {
            DispatchQueue.main.async {
                self.isConnected = false
                self.connectionStatus = .error(error.localizedDescription)
                self.onConnectionStatusChange?(false)
                self.scheduleReconnect()
            }
            return
        }
        
        guard let httpResponse = response as? HTTPURLResponse else { return }
        
        if httpResponse.statusCode == 200 {
            DispatchQueue.main.async {
                if !self.isConnected {
                    self.isConnected = true
                    self.connectionStatus = .connected
                    self.reconnectAttempts = 0
                    self.onConnectionStatusChange?(true)
                }
            }
        } else {
            DispatchQueue.main.async {
                self.connectionStatus = .error("HTTP \(httpResponse.statusCode)")
                self.scheduleReconnect()
            }
            return
        }
        
        guard let data = data else { return }
        
        // Parse SSE data
        let string = String(data: data, encoding: .utf8) ?? ""
        parseSSEEvents(from: string)
    }
    
    private func parseSSEEvents(from data: String) {
        let lines = data.components(separatedBy: .newlines)
        
        for line in lines {
            if line.hasPrefix("data:") {
                let eventData = String(line.dropFirst(5)).trimmingCharacters(in: .whitespaces)
                processGroceryUpdates(data: eventData)
            }
        }
    }
    
    private func processGroceryUpdates(data: String) {
        guard let eventData = data.data(using: .utf8) else { return }
        
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            
            // Parse as array of grocery items (matching Next.js implementation)
            let groceryItems = try decoder.decode([APIGroceryItem].self, from: eventData)
            
            DispatchQueue.main.async {
                self.onGroceryBulkUpdate?(groceryItems)
            }
        } catch {
            print("Failed to decode grocery updates: \(error)")
        }
    }
    
    
    // MARK: - Reconnection Logic
    private func scheduleReconnect() {
        guard reconnectAttempts < maxReconnectAttempts else {
            connectionStatus = .error("Max reconnection attempts reached")
            return
        }
        
        reconnectAttempts += 1
        let delay = reconnectDelay * pow(2.0, Double(reconnectAttempts - 1)) // Exponential backoff
        
        reconnectTimer = Timer.scheduledTimer(withTimeInterval: delay, repeats: false) { [weak self] _ in
            self?.connect()
        }
    }
}


// MARK: - SSE Errors
enum SSEError: Error, LocalizedError {
    case noAuthToken
    case invalidURL
    case connectionFailed
    
    var errorDescription: String? {
        switch self {
        case .noAuthToken:
            return "No authentication token available"
        case .invalidURL:
            return "Invalid SSE endpoint URL"
        case .connectionFailed:
            return "Failed to establish SSE connection"
        }
    }
}


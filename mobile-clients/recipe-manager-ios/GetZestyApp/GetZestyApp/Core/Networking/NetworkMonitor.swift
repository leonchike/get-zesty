//
//  NetworkMonitor.swift
//  GetZestyApp
//
//  Monitors network connectivity status
//

import Foundation
import Network
import Combine

class NetworkMonitor: ObservableObject {
    // MARK: - Published Properties
    @MainActor @Published var isConnected = true
    @MainActor @Published var connectionType: ConnectionType = .unknown
    
    // MARK: - Private Properties
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")
    
    enum ConnectionType {
        case wifi
        case cellular
        case ethernet
        case unknown
        
        var displayName: String {
            switch self {
            case .wifi: return "Wi-Fi"
            case .cellular: return "Cellular"
            case .ethernet: return "Ethernet"
            case .unknown: return "Unknown"
            }
        }
    }
    
    // MARK: - Initialization
    init() {
        Task { @MainActor in
            self.startMonitoring()
        }
    }
    
    deinit {
        stopMonitoring()
    }
    
    // MARK: - Public Methods
    @MainActor
    func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                self?.updateConnectionStatus(path)
            }
        }
        
        monitor.start(queue: queue)
    }
    
    func stopMonitoring() {
        monitor.cancel()
    }
    
    // MARK: - Private Methods
    @MainActor
    private func updateConnectionStatus(_ path: NWPath) {
        isConnected = path.status == .satisfied
        
        if path.usesInterfaceType(.wifi) {
            connectionType = .wifi
        } else if path.usesInterfaceType(.cellular) {
            connectionType = .cellular
        } else if path.usesInterfaceType(.wiredEthernet) {
            connectionType = .ethernet
        } else {
            connectionType = .unknown
        }
        
        // Notify APIClient about connection status
        Task { @MainActor in
            APIClient.shared.isOnline = isConnected
        }
    }
}
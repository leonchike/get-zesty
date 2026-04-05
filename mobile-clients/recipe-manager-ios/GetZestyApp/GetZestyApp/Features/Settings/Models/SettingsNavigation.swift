//
//  SettingsNavigation.swift
//  GetZestyApp
//
//  Settings navigation state management
//

import Foundation

enum SettingsNavigationState: CaseIterable {
    case home
    case profile
    case security
    case deactivate
    
    var title: String {
        switch self {
        case .home:
            return "Settings"
        case .profile:
            return "Profile"
        case .security:
            return "Security"
        case .deactivate:
            return "Delete Account"
        }
    }
    
    // MARK: - Navigation Hierarchy
    
    var isChildScreen: Bool {
        self != .home
    }
    
    var navigationLevel: Int {
        switch self {
        case .home:
            return 0
        case .profile, .security, .deactivate:
            return 1
        }
    }
    
    // MARK: - Animation Direction
    
    func animationDirection(from previousState: SettingsNavigationState) -> SettingsAnimationDirection {
        let currentLevel = self.navigationLevel
        let previousLevel = previousState.navigationLevel
        
        if currentLevel > previousLevel {
            return .forward
        } else if currentLevel < previousLevel {
            return .backward
        } else {
            return .none
        }
    }
}

enum SettingsAnimationDirection {
    case forward   // Navigating deeper (slide left)
    case backward  // Navigating back (slide right)
    case none      // Same level navigation
}
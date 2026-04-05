//
//  PreviewLayouts.swift
//  GetZestyApp
//
//  Preview utilities for accurate app representation
//

import SwiftUI

// MARK: - App Context Preview
struct AppContextPreview<Content: View>: View {
    let title: String
    let tabIcon: String
    @ViewBuilder let content: () -> Content
    
    var body: some View {
        TabView {
            NavigationStack {
                content()
            }
            .tabItem {
                Image(systemName: tabIcon)
                Text(title)
            }
        }
    }
}

// MARK: - Safe Area Preview
struct SafeAreaPreview<Content: View>: View {
    @ViewBuilder let content: () -> Content
    
    var body: some View {
        GeometryReader { geometry in
            VStack {
                // Simulate status bar/Dynamic Island space
                Color.clear
                    .frame(height: geometry.safeAreaInsets.top)
                
                content()
                
                Spacer()
            }
            .ignoresSafeArea()
        }
    }
}

// MARK: - Device Preview
extension View {
    func previewAsComponent() -> some View {
        self
            .previewLayout(.sizeThatFits)
            .padding()
    }
    
    func previewInDevice(_ device: String = "iPhone 15 Pro") -> some View {
        self
            .previewDevice(SwiftUI.PreviewDevice(rawValue: device))
            .previewDisplayName(device)
    }
    
    func previewInAppContext(title: String, icon: String) -> some View {
        AppContextPreview(title: title, tabIcon: icon) {
            self
        }
    }
}
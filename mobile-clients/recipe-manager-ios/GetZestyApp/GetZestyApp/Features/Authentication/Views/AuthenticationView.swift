//
//  AuthenticationView.swift
//  GetZestyApp
//
//  Main authentication view container
//

import SwiftUI

struct AuthenticationView: View {
    @EnvironmentObject private var authManager: AuthenticationManager
    @State private var showingLogin = true
    
    var body: some View {
        if showingLogin {
            LoginView()
                .transition(.asymmetric(
                    insertion: .move(edge: .leading),
                    removal: .move(edge: .trailing)
                ))
        } else {
            RegisterView()
                .transition(.asymmetric(
                    insertion: .move(edge: .trailing),
                    removal: .move(edge: .leading)
                ))
        }
    }
}

#Preview {
    AuthenticationView()
        .environmentObject(AuthenticationManager())
        .environmentObject(AppCoordinator())
}
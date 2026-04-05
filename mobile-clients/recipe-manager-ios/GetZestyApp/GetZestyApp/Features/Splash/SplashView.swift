//
//  SplashView.swift
//  GetZestyApp
//
//  Loading screen shown during app initialization
//

import SwiftUI

struct SplashView: View {
    @State private var logoScale: CGFloat = 0.8
    @State private var logoOpacity: Double = 0
    @State private var dotOpacity: [Double] = [0.3, 0.3, 0.3]
    
    var body: some View {
        ZStack {
            // Background
            Color.brandPrimary
                .ignoresSafeArea()
            
            VStack(spacing: 48) {
                // Logo
                Image(systemName: "fork.knife.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.white)
                    .scaleEffect(logoScale)
                    .opacity(logoOpacity)
                    .onAppear {
                        withAnimation(.spring(response: 0.8, dampingFraction: 0.6)) {
                            logoScale = 1.0
                            logoOpacity = 1.0
                        }
                    }
                
                // App Name
                Text("Zesty")
                    .font(.system(size: 48, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                    .opacity(logoOpacity)
                
                // Loading indicator
                HStack(spacing: 8) {
                    ForEach(0..<3) { index in
                        Circle()
                            .fill(Color.white)
                            .frame(width: 10, height: 10)
                            .opacity(dotOpacity[index])
                    }
                }
                .onAppear {
                    animateDots()
                }
            }
        }
    }
    
    private func animateDots() {
        // Animate each dot in sequence
        for index in 0..<3 {
            withAnimation(
                .easeInOut(duration: 0.6)
                .repeatForever()
                .delay(Double(index) * 0.2)
            ) {
                dotOpacity[index] = 1.0
            }
        }
    }
}

// Alternative modern loading view
struct ModernSplashView: View {
    @State private var isAnimating = false
    
    var body: some View {
        ZStack {
            // Gradient background
            LinearGradient(
                gradient: Gradient(colors: [
                    Color.brandPrimary,
                    Color.brandPrimary.opacity(0.8)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 32) {
                // Animated logo
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.2), lineWidth: 4)
                        .frame(width: 120, height: 120)
                    
                    Circle()
                        .trim(from: 0, to: 0.3)
                        .stroke(
                            Color.white,
                            style: StrokeStyle(lineWidth: 4, lineCap: .round)
                        )
                        .frame(width: 120, height: 120)
                        .rotationEffect(Angle(degrees: isAnimating ? 360 : 0))
                        .animation(
                            .linear(duration: 1.5).repeatForever(autoreverses: false),
                            value: isAnimating
                        )
                    
                    Image(systemName: "fork.knife")
                        .font(.system(size: 50))
                        .foregroundColor(.white)
                }
                
                VStack(spacing: 8) {
                    Text("Zesty")
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                    
                    Text("Loading your recipes...")
                        .font(.system(size: 16))
                        .foregroundColor(.white.opacity(0.8))
                }
            }
            .onAppear {
                isAnimating = true
            }
        }
    }
}

#Preview("Classic Splash") {
    SplashView()
}

#Preview("Modern Splash") {
    ModernSplashView()
}
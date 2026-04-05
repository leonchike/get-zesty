# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GetZestyApp** is a SwiftUI-based recipe management iOS app with Core Data persistence, JWT authentication, and a comprehensive design system. The app follows modern iOS development patterns with feature-based architecture.

## Build Commands

```bash
# Open project in Xcode
open GetZestyApp.xcodeproj

# Build and run (use Xcode)
# ⌘+R for build and run
# ⌘+U for tests
# ⌘+Shift+K for clean build folder

# Project supports iOS 18.5+, macOS 15.5+, visionOS 2.5+
```

## Architecture Overview

### Feature-Based Organization
```
Features/
├── Authentication/     # Login, register, password reset with JWT
├── Groceries/         # Grocery list management with Core Data
├── Splash/           # App launch experience
└── [Recipes, etc.]   # Future features
```

### Core Infrastructure
- **Authentication**: `AuthenticationManager` with Keychain integration
- **Navigation**: `AppCoordinator` for centralized navigation state
- **Data**: Core Data with `PersistenceController` and sync architecture
- **Networking**: `APIClient` with JWT refresh and error handling
- **UI**: Centralized theme system and reusable components

## Reusable Component System

### Design System Architecture (`Shared/UI/Theme.swift`)

**Centralized theme management** provides consistent colors, typography, spacing, and design tokens:

```swift
// Brand colors with semantic naming
AppTheme.brandPrimary    // #FF385C (Zesty Red)
AppTheme.brandSecondary  // #FF9800 (Orange accent)

// System-adaptive colors (automatic dark mode)
AppTheme.primaryText     // UIColor.label
AppTheme.backgroundPrimary // UIColor.systemBackground

// Design tokens
AppSpacing.md    // 16pt
AppRadius.lg     // 16pt
AppTypography.headline() // 20pt semibold
```

**Color Extensions** provide convenient access:
```swift
.brandPrimary        // Direct access to theme colors
.primaryText         // Semantic color naming
.inputBackground     // Component-specific colors
```

### Component Library (`Shared/UI/`)

#### **CustomButton.swift** - 5 Variants with Loading States
```swift
// Usage patterns
CustomButton.primary("Sign In", action: handleLogin)
CustomButton.secondary("Cancel", action: dismiss)
CustomButton.tertiary("Link", action: openURL)
CustomButton.ghost("Subtle", action: secondaryAction)
CustomButton.danger("Delete", action: deleteItem)

// With states
CustomButton.primary("Loading...", action: {}, isLoading: true, isDisabled: false)
```

#### **InputField.swift** - Comprehensive Input System
```swift
// Specialized input types
InputField.email(title: "Email", placeholder: "user@example.com", text: $email)
InputField.password(title: "Password", text: $password)
InputField.text(title: "Name", text: $name)
InputField.multiline(title: "Notes", text: $notes, minHeight: 100)
InputField.number(title: "Servings", value: $servings)

// Time input with HH:MM formatting
TimeInputField(title: "Cook Time", time: $cookTime)
```

#### **ComboBox.swift** - Dropdown with Search
```swift
ComboBox(
    title: "Category",
    placeholder: "Select category",
    options: categoryOptions,
    selectedValue: $selectedCategory
)
```

#### **BadgeAndSwitch.swift** - Status and Toggle Components
```swift
// Badge variants
Badge.default("Breakfast")
Badge.secondary("30 min")
Badge.destructive("Error")
Badge.outline("Draft")

// Switch with custom labels
SwitchInput.publicPrivate(isOn: $isPublic)
SwitchInput.enabledDisabled(title: "Notifications", isOn: $enabled)

// Checkbox component
Checkbox(isChecked: $completed, label: "2 cups flour")
```

### Component Design Principles

1. **Consistent API**: All components use similar initialization patterns
2. **Convenience Initializers**: Common variants available as static methods
3. **Theme Integration**: All colors reference centralized theme system
4. **Accessibility**: Proper labels, focus management, and keyboard navigation
5. **State Management**: @Binding for two-way data flow
6. **Preview Support**: SwiftUI previews for all component variants

### Color System Best Practices

**Use semantic colors** (not hardcoded values):
```swift
// ✅ Good - semantic, theme-aware
.foregroundColor(.primaryText)
.background(.backgroundPrimary)

// ❌ Avoid - hardcoded values
.foregroundColor(Color(red: 1.0, green: 0.22, blue: 0.36))
```

**Theme colors automatically support dark mode** through UIColor system colors.

## Authentication Flow

- **JWT Management**: Automatic token refresh, secure Keychain storage
- **Error Handling**: Comprehensive `AuthError` types with user-friendly messages
- **Form Validation**: Real-time validation in authentication views
- **Navigation**: Centralized auth state through `AppCoordinator`

## Data Architecture

### Core Data Integration
- **Models**: Recipe, GroceryItem, GrocerySection with sync support
- **Relationships**: Proper Core Data relationships and cascade rules
- **Offline-First**: Local storage with planned server sync

### API Client Pattern

**Centralized Route Management** (`Core/Networking/APIRoutes.swift`):
```swift
// ✅ Good - use centralized routes
APIRoutes.Auth.emailLogin           // "/api/mobile-auth/login"
APIRoutes.User.getCurrentUser       // "/api/mobile/user-get-current"
APIRoutes.Recipe.search             // "/api/mobile/recipe-search"
APIRoutes.Grocery.getUserGroceries  // "/api/mobile-groceries"

// ❌ Avoid - hardcoded route strings
"/api/mobile-auth/login"
```

**Consistent async/await networking**:
```swift
// Using centralized routes with APIClient
let response = try await apiClient.request(
    endpoint: APIEndpoint(
        path: APIRoutes.Auth.emailLogin,
        method: .POST,
        body: loginRequest
    ),
    responseType: AuthResponse.self
)
```

**Route validation and organization**:
- All routes match the React Native app exactly
- Structured by feature (Auth, User, Recipe, Grocery, Upload)
- Helper methods for dynamic routes with IDs
- Built-in validation and debugging support

**🚨 IMPORTANT: Always reference the React Native app for API integration**:
- Check request/response formats in `recipe-manager-mobile-react-native/lib/backend-api.ts`
- Verify request body structure and HTTP methods
- Match data wrapping patterns (e.g., `{ data: Partial<User> }` for profile updates)
- Ensure consistent error handling between platforms

**Example API Patterns - All wrapped in "data" field**:
```swift
// ✅ Profile Update (PATCH)
struct UpdateProfileRequest: Codable {
    let data: PartialUser
}

// ✅ Password Update (PATCH) 
struct ChangePasswordRequest: Codable {
    let data: PasswordData  // { oldPassword, newPassword }
}

// ✅ Account Deactivation (POST)
struct DeactivateAccountRequest: Codable {
    let data: AccountData   // { password }
}

// All return structured responses:
struct ApiResponse: Codable {
    let success: Bool
    let error: String?
    let message: String?
}
```

## Key Dependencies

- **SDWebImage** (5.18.0+): Efficient image loading and caching
- **SwiftSoup** (2.6.0+): HTML parsing for recipe scraping
- **Core Data**: Local persistence with sync architecture
- **Combine**: Reactive programming for data flow

## Development Notes

### Refactoring Authentication Views
All authentication views (LoginView, RegisterView, PasswordResetView) have been refactored to use the reusable component system instead of custom implementations.

### Component Usage Pattern
When creating new UI, always check `Shared/UI/` for existing components before creating custom implementations. This ensures consistency and reduces code duplication.

### Color Definition Management
Colors are centrally managed in `Theme.swift`. Never hardcode color values - always use the semantic color system to ensure proper dark mode support and design consistency.
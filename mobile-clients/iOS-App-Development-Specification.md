# Recipe Manager iOS App - Development Specification

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technical Architecture](#technical-architecture)
3. [Feature Parity Matrix](#feature-parity-matrix)
4. [Core Data Sync Service](#core-data-sync-service)
5. [Implementation Phases](#implementation-phases)
6. [Detailed Feature Specifications](#detailed-feature-specifications)
7. [iOS-Specific Enhancements](#ios-specific-enhancements)
8. [Development Guidelines](#development-guidelines)
9. [Testing Strategy](#testing-strategy)
10. [Deployment & Distribution](#deployment--distribution)

## Project Overview

### Objective
Develop a native iOS application for the Recipe Manager platform that provides 100% feature parity with the React Native version while leveraging iOS-specific capabilities and ensuring seamless cross-platform data synchronization.

### Key Requirements
- **Feature Parity**: All React Native features must be available on iOS
- **API-First Architecture**: Backend API is the single source of truth for all data
- **Cross-Platform Sync**: Changes on web/Android immediately visible on iOS
- **Offline Support**: Core Data persistence with intelligent sync
- **Native iOS Experience**: Leverage iOS-specific UI patterns and capabilities

### Target iOS Versions
- **Minimum**: iOS 16.0
- **Target**: iOS 17.0+
- **Devices**: iPhone, iPad, Apple Watch (future)

## Technical Architecture

### Core Technologies

#### Development Stack
```swift
// Primary Technologies
- SwiftUI 5.0+                    // Declarative UI framework
- iOS 16.0+ SDK                   // Platform SDK
- Combine Framework               // Reactive programming
- Core Data                       // Local data persistence
- CloudKit (future)               // Apple ecosystem sync

// Networking & API
- URLSession                      // Native networking
- Alamofire 5.8+                  // Advanced networking features
- Server-Sent Events              // Real-time updates

// Authentication & Security
- Keychain Services               // Secure credential storage
- CryptoKit                       // Cryptographic operations
- AuthenticationServices          // Future OAuth flows (Phase 4)

// Third-Party Libraries
- SDWebImage 5.18+                // Image loading and caching
- SwiftSoup                       // HTML parsing for recipe scraping
```

#### Project Structure
```
RecipeManager/
├── RecipeManagerApp.swift              # App entry point
├── Core/                               # Core app infrastructure
│   ├── Navigation/                     # Navigation management
│   ├── Networking/                     # API client and networking
│   ├── Authentication/                 # Auth management
│   ├── DataSync/                       # Sync service architecture
│   └── Extensions/                     # Swift extensions
├── Features/                           # Feature modules
│   ├── Authentication/
│   │   ├── Views/
│   │   ├── ViewModels/
│   │   ├── Models/
│   │   └── Services/
│   ├── Recipes/
│   │   ├── Views/
│   │   │   ├── RecipeList/
│   │   │   ├── RecipeDetail/
│   │   │   ├── RecipeForm/
│   │   │   └── RecipeChat/
│   │   ├── ViewModels/
│   │   ├── Models/
│   │   └── Services/
│   ├── Groceries/
│   │   ├── Views/
│   │   ├── ViewModels/
│   │   ├── Models/
│   │   ├── Services/
│   │   └── CoreData/
│   ├── Settings/
│   └── CookingExperience/
├── Shared/                             # Shared components
│   ├── UI/                             # Reusable UI components
│   ├── Models/                         # Shared data models
│   ├── Extensions/                     # Utility extensions
│   └── Constants/                      # App constants
├── Resources/                          # App resources
│   ├── Assets.xcassets
│   ├── Colors.xcassets
│   ├── Localizable.strings
│   └── RecipeManager.xcdatamodeld      # Core Data model
└── Tests/                              # Test files
    ├── Unit/
    ├── Integration/
    └── UI/
```

### Architecture Patterns

#### MVVM + Repository Pattern
```swift
// View Layer (SwiftUI)
struct RecipeListView: View {
    @StateObject private var viewModel = RecipeListViewModel()
    
    var body: some View {
        // SwiftUI view implementation
    }
}

// ViewModel Layer
@MainActor
class RecipeListViewModel: ObservableObject {
    @Published var recipes: [Recipe] = []
    @Published var isLoading = false
    @Published var error: Error?
    
    private let repository: RecipeRepository
    
    func loadRecipes() async {
        // Business logic
    }
}

// Repository Layer
protocol RecipeRepository {
    func fetchRecipes() async throws -> [Recipe]
    func createRecipe(_ recipe: Recipe) async throws -> Recipe
    func updateRecipe(_ recipe: Recipe) async throws -> Recipe
    func deleteRecipe(id: String) async throws
}

class RemoteRecipeRepository: RecipeRepository {
    private let apiClient: APIClient
    private let cacheManager: CacheManager
    
    // Implementation with API calls and caching
}
```

## Feature Parity Matrix

### Authentication Features
| Feature | React Native | iOS Implementation | Priority | Notes |
|---------|-------------|-------------------|----------|--------|
| Email/Password Login | ✅ | 🎯 Phase 1 | P0 | Native login form with validation |
| User Registration | ✅ | 🎯 Phase 1 | P0 | Form validation and error handling |
| Password Reset | ✅ | 🎯 Phase 1 | P0 | Email-based reset flow |
| Auto-login | ✅ | 🎯 Phase 1 | P0 | Keychain-based token storage |
| Session Management | ✅ | 🎯 Phase 1 | P0 | JWT token refresh logic |
| Google OAuth | ❌ | 🔮 Future Phase | P3 | GoogleSignIn-iOS framework (later version) |

### Recipe Management Features
| Feature | React Native | iOS Implementation | Priority | Notes |
|---------|-------------|-------------------|----------|--------|
| Recipe List View | ✅ | 🎯 Phase 1 | P0 | SwiftUI List with lazy loading |
| Recipe Search | ✅ | 🎯 Phase 1 | P0 | Real-time search with debouncing |
| Advanced Filters | ✅ | 🎯 Phase 2 | P1 | Filter sheet with multiple criteria |
| Recipe Detail View | ✅ | 🎯 Phase 1 | P0 | Full-screen modal presentation |
| Recipe Creation | ✅ | 🎯 Phase 2 | P1 | Form with validation and image upload |
| Recipe Editing | ✅ | 🎯 Phase 2 | P1 | Pre-populated form with updates |
| Recipe Deletion | ✅ | 🎯 Phase 2 | P1 | Confirmation alert and API call |
| Image Upload | ✅ | 🎯 Phase 2 | P1 | PHPickerViewController integration |
| AI Recipe Generation | ✅ | 🎯 Phase 3 | P1 | Chat interface for recipe creation |
| Recipe Scraping | ✅ | 🎯 Phase 3 | P2 | URL-based recipe import |
| Recipe Sharing | ✅ | 🎯 Phase 4 | P2 | iOS share sheet integration |
| Pinned Recipes | ✅ | 🎯 Phase 2 | P1 | Quick access favorites |
| Recipe Rating | ✅ | 🎯 Phase 4 | P2 | Star rating component |

### Grocery Management Features
| Feature | React Native | iOS Implementation | Priority | Notes |
|---------|-------------|-------------------|----------|--------|
| Grocery List View | ✅ | 🎯 Phase 1 | P0 | Sectioned list with Core Data |
| Add Grocery Items | ✅ | 🎯 Phase 1 | P0 | Inline editing and quick add |
| Edit Grocery Items | ✅ | 🎯 Phase 1 | P0 | Swipe actions and detail editing |
| Complete Items | ✅ | 🎯 Phase 1 | P0 | Check/uncheck with animations |
| Delete Items | ✅ | 🎯 Phase 1 | P0 | Swipe to delete with confirmation |
| Real-time Sync | ✅ | 🎯 Phase 1 | P0 | **Enhanced with Core Data** |
| Section Organization | ✅ | 🎯 Phase 1 | P0 | Auto-categorization by store section |
| Recipe Integration | ✅ | 🎯 Phase 2 | P1 | Add recipe ingredients to list |
| Shake to Undo | ✅ | 🎯 Phase 2 | P1 | Motion detection with haptic feedback |
| Quantity Management | ✅ | 🎯 Phase 1 | P0 | Quantity and unit tracking |
| **Offline Support** | ❌ | 🆕 **New Feature** | P0 | Core Data persistence |
| **Smart Sync** | ❌ | 🆕 **New Feature** | P0 | Conflict resolution and merge |

### AI & Advanced Features
| Feature | React Native | iOS Implementation | Priority | Notes |
|---------|-------------|-------------------|----------|--------|
| AI Recipe Chat | ✅ | 🎯 Phase 3 | P1 | Interactive chat interface |
| Recipe Modifications | ✅ | 🎯 Phase 3 | P1 | AI-powered recipe adjustments |
| Image Generation | ✅ | 🎯 Phase 3 | P2 | Background AI image creation |
| Cooking Mode | ✅ | 🎯 Phase 3 | P1 | Step-by-step cooking guidance |
| Timer Integration | ✅ | 🎯 Phase 3 | P1 | Multiple cooking timers |
| Voice Commands | ❌ | 🆕 **iOS Enhancement** | P3 | Siri integration for hands-free |

### Settings & Profile
| Feature | React Native | iOS Implementation | Priority | Notes |
|---------|-------------|-------------------|----------|--------|
| Profile Management | ✅ | 🎯 Phase 2 | P1 | User info editing |
| Password Change | ✅ | 🎯 Phase 2 | P1 | Secure password update |
| Account Deactivation | ✅ | 🎯 Phase 4 | P2 | Account deletion flow |
| Theme Selection | ✅ | 🎯 Phase 1 | P0 | Light/Dark mode + system |
| Notification Settings | ✅ | 🎯 Phase 3 | P2 | Push notification preferences |

## Core Data Sync Service

### Enhanced Grocery Sync Architecture

#### Core Data Model
```swift
// GroceryItem Entity
@objc(GroceryItem)
public class GroceryItem: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var name: String
    @NSManaged public var quantity: Double
    @NSManaged public var quantityUnit: String?
    @NSManaged public var status: String
    @NSManaged public var sectionId: String?
    @NSManaged public var recipeId: String?
    @NSManaged public var createdAt: Date
    @NSManaged public var updatedAt: Date
    @NSManaged public var lastSyncedAt: Date?
    @NSManaged public var isDirty: Bool           // Local changes pending sync
    @NSManaged public var isDeleted: Bool         // Soft delete flag
    @NSManaged public var serverVersion: Int32    // For conflict resolution
}

// GrocerySection Entity
@objc(GrocerySection)
public class GrocerySection: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var name: String
    @NSManaged public var emoji: String?
    @NSManaged public var sortOrder: Int32
    @NSManaged public var items: NSSet?
}
```

#### Sync Service Implementation
```swift
@MainActor
class GrocerySyncService: ObservableObject {
    @Published var syncStatus: SyncStatus = .idle
    @Published var lastSyncTime: Date?
    
    private let apiClient: APIClient
    private let coreDataManager: CoreDataManager
    private let sseManager: SSEManager
    private var syncTimer: Timer?
    
    enum SyncStatus {
        case idle
        case syncing
        case error(Error)
        case success
    }
    
    // MARK: - Initialization
    init(apiClient: APIClient, coreDataManager: CoreDataManager) {
        self.apiClient = apiClient
        self.coreDataManager = coreDataManager
        self.sseManager = SSEManager(apiClient: apiClient)
        
        setupSSEConnection()
        startPeriodicSync()
    }
    
    // MARK: - SSE Real-time Updates
    private func setupSSEConnection() {
        sseManager.onGroceryUpdate = { [weak self] update in
            Task { @MainActor in
                await self?.handleRemoteUpdate(update)
            }
        }
        
        sseManager.connect()
    }
    
    private func handleRemoteUpdate(_ update: GroceryUpdateEvent) async {
        switch update.type {
        case .created:
            await mergeRemoteItem(update.item)
        case .updated:
            await mergeRemoteItem(update.item)
        case .deleted:
            await deleteLocalItem(id: update.item.id)
        }
    }
    
    // MARK: - Sync Operations
    func syncGroceries() async {
        syncStatus = .syncing
        
        do {
            // 1. Push local changes to server
            try await pushLocalChanges()
            
            // 2. Fetch latest data from server
            let remoteItems = try await fetchRemoteGroceries()
            
            // 3. Merge with local data
            await mergeRemoteData(remoteItems)
            
            // 4. Clean up successfully synced items
            await cleanupSyncedItems()
            
            lastSyncTime = Date()
            syncStatus = .success
            
        } catch {
            syncStatus = .error(error)
        }
    }
    
    private func pushLocalChanges() async throws {
        let dirtyItems = coreDataManager.fetchDirtyGroceryItems()
        
        for item in dirtyItems {
            if item.isDeleted {
                try await apiClient.deleteGroceryItem(id: item.id)
            } else if item.lastSyncedAt == nil {
                let created = try await apiClient.createGroceryItem(item.toAPIModel())
                await updateLocalItem(item, with: created)
            } else {
                let updated = try await apiClient.updateGroceryItem(item.toAPIModel())
                await updateLocalItem(item, with: updated)
            }
        }
    }
    
    private func fetchRemoteGroceries() async throws -> [APIGroceryItem] {
        let timestamp = lastSyncTime ?? Date.distantPast
        return try await apiClient.fetchGroceries(since: timestamp)
    }
    
    private func mergeRemoteData(_ remoteItems: [APIGroceryItem]) async {
        for remoteItem in remoteItems {
            await mergeRemoteItem(remoteItem)
        }
    }
    
    private func mergeRemoteItem(_ remoteItem: APIGroceryItem) async {
        guard let localItem = coreDataManager.fetchGroceryItem(id: remoteItem.id) else {
            // Item doesn't exist locally, create it
            await createLocalItem(from: remoteItem)
            return
        }
        
        // Conflict resolution: server version wins unless local has newer changes
        if !localItem.isDirty || remoteItem.serverVersion > localItem.serverVersion {
            await updateLocalItem(localItem, with: remoteItem)
        }
        // If local is dirty and newer, keep local changes (will be pushed next sync)
    }
    
    // MARK: - Local Operations with Optimistic Updates
    func addGroceryItem(_ item: GroceryItemInput) async {
        // 1. Immediately add to Core Data for instant UI update
        let localItem = await createLocalItem(from: item)
        
        // 2. Optimistically sync to server in background
        Task {
            do {
                let serverItem = try await apiClient.createGroceryItem(item)
                await updateLocalItem(localItem, with: serverItem)
            } catch {
                // Handle error - mark for retry or show error
                await markItemForRetry(localItem)
            }
        }
    }
    
    func updateGroceryItem(_ item: GroceryItem, with changes: GroceryItemInput) async {
        // 1. Update Core Data immediately
        await updateLocalItem(item, changes: changes)
        
        // 2. Sync to server
        Task {
            do {
                let serverItem = try await apiClient.updateGroceryItem(changes)
                await updateLocalItem(item, with: serverItem)
            } catch {
                await markItemForRetry(item)
            }
        }
    }
    
    func deleteGroceryItem(_ item: GroceryItem) async {
        // 1. Soft delete locally (immediate UI update)
        await softDeleteLocalItem(item)
        
        // 2. Delete on server
        Task {
            do {
                try await apiClient.deleteGroceryItem(id: item.id)
                await hardDeleteLocalItem(item)
            } catch {
                // Revert soft delete and mark for retry
                await revertSoftDelete(item)
            }
        }
    }
    
    // MARK: - Offline Support
    func enableOfflineMode() {
        sseManager.disconnect()
        syncTimer?.invalidate()
    }
    
    func enableOnlineMode() {
        setupSSEConnection()
        startPeriodicSync()
        Task {
            await syncGroceries()
        }
    }
    
    private func startPeriodicSync() {
        syncTimer = Timer.scheduledTimer(withTimeInterval: 300, repeats: true) { _ in
            Task { @MainActor in
                await self.syncGroceries()
            }
        }
    }
}

// MARK: - Core Data Helper Methods
extension GrocerySyncService {
    private func createLocalItem(from apiItem: APIGroceryItem) async -> GroceryItem {
        return await coreDataManager.performBackgroundTask { context in
            let item = GroceryItem(context: context)
            item.configure(from: apiItem)
            item.isDirty = false
            item.lastSyncedAt = Date()
            return item
        }
    }
    
    private func updateLocalItem(_ item: GroceryItem, with apiItem: APIGroceryItem) async {
        await coreDataManager.performBackgroundTask { context in
            item.configure(from: apiItem)
            item.isDirty = false
            item.lastSyncedAt = Date()
            item.serverVersion = apiItem.serverVersion
        }
    }
    
    private func markItemForRetry(_ item: GroceryItem) async {
        await coreDataManager.performBackgroundTask { context in
            item.isDirty = true
            // Could implement exponential backoff retry logic here
        }
    }
}
```

#### SSE Manager for Real-time Updates
```swift
class SSEManager {
    private let apiClient: APIClient
    private var eventSource: URLSessionDataTask?
    
    var onGroceryUpdate: ((GroceryUpdateEvent) -> Void)?
    var onConnectionStatusChange: ((Bool) -> Void)?
    
    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }
    
    func connect() {
        guard let url = URL(string: "\(apiClient.baseURL)/api/mobile-groceries-updates") else { return }
        
        var request = URLRequest(url: url)
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        request.setValue("no-cache", forHTTPHeaderField: "Cache-Control")
        
        // Add auth header
        if let token = KeychainManager.shared.getAuthToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        eventSource = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let data = data else { return }
            
            let string = String(data: data, encoding: .utf8) ?? ""
            self?.parseSSEData(string)
        }
        
        eventSource?.resume()
        onConnectionStatusChange?(true)
    }
    
    func disconnect() {
        eventSource?.cancel()
        eventSource = nil
        onConnectionStatusChange?(false)
    }
    
    private func parseSSEData(_ data: String) {
        let lines = data.components(separatedBy: .newlines)
        
        for line in lines {
            if line.hasPrefix("data: ") {
                let jsonString = String(line.dropFirst(6))
                guard let jsonData = jsonString.data(using: .utf8),
                      let update = try? JSONDecoder().decode(GroceryUpdateEvent.self, from: jsonData) else {
                    continue
                }
                
                DispatchQueue.main.async {
                    self.onGroceryUpdate?(update)
                }
            }
        }
    }
}
```

## Implementation Phases

### Phase 1: Core Foundation (Weeks 1-4)
**Goal**: Establish basic app structure with authentication and grocery management foundation

#### Week 1: Project Setup & Architecture ✅
- [x] Create Xcode project with proper structure
- [x] Set up Core Data model for groceries
- [x] Implement basic navigation (TabView)
- [x] Set up networking layer (APIClient)
- [x] Configure third-party dependencies

#### Week 2: Authentication System ✅
- [x] Implement KeychainManager for secure storage
- [x] Build AuthenticationManager with JWT handling
- [x] Create login/register SwiftUI views
- [x] Implement email/password authentication flow
- [x] Implement token refresh logic
- [x] Add password reset functionality

#### Week 3: Basic Grocery Management
- [ ] Implement GrocerySyncService foundation
- [ ] Create GroceryListView with Core Data integration
- [ ] Add basic CRUD operations for grocery items
- [ ] Implement real-time SSE connection
- [ ] Add offline Core Data persistence

#### Week 4: Basic Recipe Viewing
- [ ] Create Recipe data models
- [ ] Implement RecipeRepository with API integration
- [ ] Build RecipeListView with basic functionality
- [ ] Implement RecipeDetailView modal
- [ ] Add search functionality

### Phase 2: Enhanced Features (Weeks 5-8)
**Goal**: Add recipe management and advanced grocery features

#### Week 5: Recipe Creation & Editing
- [ ] Build RecipeFormView with validation
- [ ] Implement image upload functionality
- [ ] Add recipe editing capabilities
- [ ] Implement recipe deletion with confirmation

#### Week 6: Advanced Grocery Features
- [ ] Complete GrocerySyncService with conflict resolution
- [ ] Add recipe-to-grocery integration
- [ ] Implement shake-to-undo functionality
- [ ] Add section-based organization

#### Week 7: Search & Filtering
- [ ] Implement advanced recipe filters
- [ ] Add pinned recipes functionality
- [ ] Create filter sheet UI
- [ ] Add sorting options

#### Week 8: Settings & Profile
- [ ] Build settings interface
- [ ] Implement profile management
- [ ] Add theme selection
- [ ] Implement password change functionality

### Phase 3: AI Features (Weeks 9-12)
**Goal**: Implement AI-powered features and cooking experience

#### Week 9: AI Recipe Chat Foundation
- [ ] Create chat interface components
- [ ] Implement ChatManager for API communication
- [ ] Build message display system
- [ ] Add typing indicators and loading states

#### Week 10: AI Recipe Generation
- [ ] Complete AI recipe generation flow
- [ ] Implement recipe modification through chat
- [ ] Add save-from-chat functionality
- [ ] Integrate with existing recipe system

#### Week 11: Cooking Experience
- [ ] Build step-by-step cooking interface
- [ ] Implement cooking timers
- [ ] Add ingredient tracking during cooking
- [ ] Create progress indicators

#### Week 12: Advanced AI Features
- [ ] Implement background image generation
- [ ] Add recipe scraping functionality
- [ ] Enhance AI chat with context awareness
- [ ] Add recipe suggestions

### Phase 4: Polish & iOS Enhancements (Weeks 13-16)
**Goal**: iOS-specific features and final polish

#### Week 13: iOS-Specific Features
- [ ] Implement Siri Shortcuts integration
- [ ] Add Spotlight search support
- [ ] Create Today widget for quick access
- [ ] Implement Handoff support
- [ ] Add Google Sign-In integration (future enhancement)

#### Week 14: Performance & Optimization
- [ ] Optimize Core Data performance
- [ ] Implement image caching strategies
- [ ] Add background app refresh
- [ ] Optimize memory usage

#### Week 15: Testing & Bug Fixes
- [ ] Comprehensive unit testing
- [ ] Integration testing for sync service
- [ ] UI testing for critical flows
- [ ] Performance testing

#### Week 16: App Store Preparation
- [ ] Create App Store assets
- [ ] Implement App Store Connect integration
- [ ] Final QA and testing
- [ ] Prepare for submission

## Detailed Feature Specifications

### 1. Enhanced Grocery Sync Service

#### Core Data Sync Strategy
```swift
// Sync conflict resolution strategy
enum SyncConflictResolution {
    case serverWins          // Default: API is source of truth
    case localWins           // For user-initiated changes
    case merge              // Merge compatible changes
    case userChoice         // Let user decide (for complex conflicts)
}

// Sync operation types
enum SyncOperation {
    case fullSync           // Complete data refresh
    case incrementalSync    // Changes since last sync
    case pushOnly          // Upload local changes only
    case pullOnly          // Download remote changes only
}
```

#### API-First Data Flow
1. **User Action** → Immediate Core Data update (optimistic UI)
2. **Background Sync** → API call with local changes
3. **Success** → Mark as synced, update UI if needed
4. **Failure** → Mark for retry, show sync status
5. **Real-time Updates** → SSE events update Core Data directly

#### Offline Behavior
- All grocery operations work offline
- Changes queued for sync when online
- Visual indicators show sync status
- Conflict resolution when coming back online

### 2. Recipe Management System

#### Recipe Data Model
```swift
struct Recipe: Codable, Identifiable {
    let id: String
    var title: String
    var description: String?
    var difficulty: RecipeDifficulty
    var prepTime: Int?
    var cookTime: Int?
    var restTime: Int?
    var totalTime: Int?
    var servings: Int?
    var ingredients: String?
    var instructions: String?
    var equipment: String?
    var nutrition: RecipeNutrition?
    var notes: String?
    var isPublic: Bool
    var cuisineType: String?
    var mealType: String?
    var dietaryRestrictions: [String]
    var tags: [String]
    var sourceUrl: String?
    var imageUrl: String?
    var rating: Double?
    var isDeleted: Bool
    var reviewCount: Int
    var favoriteCount: Int
    var seasonality: String?
    var createdAt: Date
    var updatedAt: Date
    var source: RecipeSource
    var parsedIngredients: [ParsedIngredient]?
    var isPinned: Bool = false
}

enum RecipeDifficulty: String, CaseIterable, Codable {
    case easy = "EASY"
    case medium = "MEDIUM"
    case hard = "HARD"
    
    var displayName: String {
        switch self {
        case .easy: return "Easy"
        case .medium: return "Medium"
        case .hard: return "Hard"
        }
    }
}

enum RecipeSource: String, Codable {
    case user = "USER"
    case scrape = "SCRAPE"
    case genAI = "GEN_AI"
}
```

#### Recipe Repository Pattern
```swift
protocol RecipeRepository {
    func fetchRecipes(page: Int, filters: RecipeFilters?) async throws -> RecipePage
    func searchRecipes(query: String, filters: RecipeFilters?) async throws -> [Recipe]
    func getRecipe(id: String) async throws -> Recipe
    func createRecipe(_ recipe: CreateRecipeRequest) async throws -> Recipe
    func updateRecipe(_ recipe: Recipe) async throws -> Recipe
    func deleteRecipe(id: String) async throws
    func pinRecipe(id: String) async throws
    func unpinRecipe(id: String) async throws
    func getPinnedRecipes() async throws -> [Recipe]
    func generateAIRecipe(prompt: String) async throws -> Recipe
    func scrapeRecipe(url: URL) async throws -> Recipe
}

class RemoteRecipeRepository: RecipeRepository {
    private let apiClient: APIClient
    private let cacheManager: RecipeCacheManager
    
    // Implementation with caching and error handling
}
```

### 3. AI Recipe Chat System

#### Chat Interface Components
```swift
// Chat message model
struct ChatMessage: Identifiable, Codable {
    let id: String
    let role: MessageRole
    let content: String
    let type: MessageType
    let timestamp: Date
    var recipeData: Recipe?
    
    enum MessageRole: String, Codable {
        case user, assistant
    }
    
    enum MessageType: String, Codable {
        case text, recipe, recipeModification
    }
}

// Chat session management
@MainActor
class RecipeChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var isLoading = false
    @Published var error: Error?
    @Published var currentRecipe: Recipe?
    @Published var hasGeneratedRecipe = false
    
    private let apiClient: APIClient
    
    func sendMessage(_ content: String) async {
        // Add user message immediately
        let userMessage = ChatMessage(
            id: UUID().uuidString,
            role: .user,
            content: content,
            type: .text,
            timestamp: Date()
        )
        messages.append(userMessage)
        
        // Send to API and handle response
        isLoading = true
        do {
            let response = try await apiClient.sendChatMessage(
                message: content,
                chatHistory: messages
            )
            
            let assistantMessage = ChatMessage(
                id: UUID().uuidString,
                role: .assistant,
                content: response.content,
                type: response.type == "recipe" ? .recipe : .text,
                timestamp: Date(),
                recipeData: response.recipeData
            )
            
            messages.append(assistantMessage)
            
            if let recipe = response.recipeData {
                currentRecipe = recipe
                hasGeneratedRecipe = true
            }
            
        } catch {
            self.error = error
        }
        isLoading = false
    }
    
    func saveCurrentRecipe() async throws -> String {
        guard let recipe = currentRecipe else {
            throw ChatError.noRecipeToSave
        }
        
        let savedRecipe = try await apiClient.saveRecipeFromChat(recipe)
        return savedRecipe.id
    }
    
    func clearChat() {
        messages.removeAll()
        currentRecipe = nil
        hasGeneratedRecipe = false
        error = nil
    }
}
```

#### Chat UI Implementation
```swift
struct RecipeChatView: View {
    @StateObject private var viewModel = RecipeChatViewModel()
    @State private var messageText = ""
    @FocusState private var isTextFieldFocused: Bool
    
    var body: some View {
        NavigationView {
            VStack {
                // Messages list
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 12) {
                            ForEach(viewModel.messages) { message in
                                ChatMessageView(message: message)
                                    .id(message.id)
                            }
                            
                            if viewModel.isLoading {
                                TypingIndicatorView()
                            }
                        }
                        .padding()
                    }
                    .onChange(of: viewModel.messages.count) { _ in
                        if let lastMessage = viewModel.messages.last {
                            withAnimation {
                                proxy.scrollTo(lastMessage.id, anchor: .bottom)
                            }
                        }
                    }
                }
                
                // Input area
                HStack {
                    TextField("Ask about recipes...", text: $messageText, axis: .vertical)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .focused($isTextFieldFocused)
                        .onSubmit {
                            sendMessage()
                        }
                    
                    Button(action: sendMessage) {
                        Image(systemName: "paperplane.fill")
                            .foregroundColor(.blue)
                    }
                    .disabled(messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || viewModel.isLoading)
                }
                .padding()
            }
            .navigationTitle("AI Recipe Assistant")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Clear") {
                        viewModel.clearChat()
                    }
                }
            }
        }
    }
    
    private func sendMessage() {
        let message = messageText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !message.isEmpty else { return }
        
        messageText = ""
        isTextFieldFocused = false
        
        Task {
            await viewModel.sendMessage(message)
        }
    }
}
```

### 4. Cooking Experience System

#### Cooking Session Management
```swift
@MainActor
class CookingSessionViewModel: ObservableObject {
    @Published var currentStep = 0
    @Published var completedSteps: Set<Int> = []
    @Published var usedIngredients: Set<Int> = []
    @Published var activeTimers: [CookingTimer] = []
    @Published var isCompleted = false
    
    let recipe: Recipe
    private let timerManager = CookingTimerManager()
    
    init(recipe: Recipe) {
        self.recipe = recipe
    }
    
    func nextStep() {
        guard currentStep < recipe.parsedInstructions.count - 1 else {
            completeSession()
            return
        }
        
        markStepCompleted(currentStep)
        currentStep += 1
    }
    
    func previousStep() {
        guard currentStep > 0 else { return }
        currentStep -= 1
    }
    
    func markStepCompleted(_ step: Int) {
        completedSteps.insert(step)
    }
    
    func markIngredientUsed(_ index: Int) {
        usedIngredients.insert(index)
    }
    
    func startTimer(for duration: TimeInterval, title: String) {
        let timer = CookingTimer(
            id: UUID(),
            title: title,
            duration: duration,
            startTime: Date()
        )
        
        activeTimers.append(timer)
        timerManager.startTimer(timer) { [weak self] in
            self?.timerCompleted(timer)
        }
    }
    
    private func timerCompleted(_ timer: CookingTimer) {
        activeTimers.removeAll { $0.id == timer.id }
        // Trigger notification or haptic feedback
        HapticManager.shared.triggerTimerComplete()
    }
    
    private func completeSession() {
        isCompleted = true
        // Track completion analytics
        AnalyticsManager.shared.trackCookingSessionCompleted(recipe.id)
    }
}

struct CookingTimer: Identifiable {
    let id: UUID
    let title: String
    let duration: TimeInterval
    let startTime: Date
    
    var isExpired: Bool {
        Date().timeIntervalSince(startTime) >= duration
    }
    
    var remainingTime: TimeInterval {
        max(0, duration - Date().timeIntervalSince(startTime))
    }
}
```

### 5. Image Management System

#### Image Upload and Caching
```swift
class ImageManager: ObservableObject {
    static let shared = ImageManager()
    
    private let apiClient: APIClient
    private let cacheManager: ImageCacheManager
    
    func uploadRecipeImage(_ image: UIImage, for recipeId: String) async throws -> String {
        // 1. Compress image
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            throw ImageError.compressionFailed
        }
        
        // 2. Get upload URL from API
        let uploadResponse = try await apiClient.getCloudflareUploadURL()
        
        // 3. Upload to Cloudflare
        let cloudflareURL = try await uploadToCloudflare(
            data: imageData,
            uploadURL: uploadResponse.uploadURL
        )
        
        // 4. Update recipe with image URL
        try await apiClient.updateRecipeImage(recipeId: recipeId, imageURL: cloudflareURL)
        
        return cloudflareURL
    }
    
    func generateAIImage(for recipe: Recipe) async throws -> String {
        let response = try await apiClient.generateRecipeImage(
            title: recipe.title,
            recipeId: recipe.id
        )
        
        // Cache the generated image
        await cacheManager.cacheImage(at: response.imageURL)
        
        return response.imageURL
    }
    
    private func uploadToCloudflare(data: Data, uploadURL: URL) async throws -> String {
        var request = URLRequest(url: uploadURL)
        request.httpMethod = "POST"
        request.httpBody = data
        request.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
        
        let (responseData, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw ImageError.uploadFailed
        }
        
        let uploadResponse = try JSONDecoder().decode(CloudflareUploadResponse.self, from: responseData)
        return uploadResponse.imageURL
    }
}
```

## iOS-Specific Enhancements

### 1. Siri Shortcuts Integration
```swift
import Intents
import IntentsUI

// Custom intent for recipe search
class SearchRecipesIntent: INIntent {
    @NSManaged public var searchQuery: String?
    @NSManaged public var mealType: String?
}

// Intent handler
class RecipeIntentHandler: NSObject, SearchRecipesIntentHandling {
    func handle(intent: SearchRecipesIntent, completion: @escaping (SearchRecipesIntentResponse) -> Void) {
        // Handle Siri search request
        let response = SearchRecipesIntentResponse(code: .success, userActivity: nil)
        completion(response)
    }
}

// Register shortcuts
class ShortcutManager {
    static func registerShortcuts() {
        let searchActivity = NSUserActivity(activityType: "com.recipemanager.searchRecipes")
        searchActivity.title = "Search Recipes"
        searchActivity.suggestedInvocationPhrase = "Search my recipes"
        searchActivity.isEligibleForSearch = true
        searchActivity.isEligibleForPrediction = true
        
        searchActivity.becomeCurrent()
    }
}
```

### 2. Today Widget Implementation
```swift
import WidgetKit
import SwiftUI

struct RecipeWidgetEntry: TimelineEntry {
    let date: Date
    let featuredRecipe: Recipe?
    let quickAccessRecipes: [Recipe]
}

struct RecipeWidgetProvider: TimelineProvider {
    func getTimeline(in context: Context, completion: @escaping (Timeline<RecipeWidgetEntry>) -> Void) {
        // Fetch today's featured recipe and quick access recipes
        let entry = RecipeWidgetEntry(
            date: Date(),
            featuredRecipe: nil, // Fetch from API
            quickAccessRecipes: [] // Fetch pinned recipes
        )
        
        let timeline = Timeline(entries: [entry], policy: .atEnd)
        completion(timeline)
    }
}

struct RecipeWidget: Widget {
    let kind: String = "RecipeWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: RecipeWidgetProvider()) { entry in
            RecipeWidgetView(entry: entry)
        }
        .configurationDisplayName("Recipe Quick Access")
        .description("Quick access to your favorite recipes")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

### 3. Spotlight Search Integration
```swift
import CoreSpotlight
import MobileCoreServices

class SpotlightManager {
    static func indexRecipe(_ recipe: Recipe) {
        let attributeSet = CSSearchableItemAttributeSet(itemContentType: kUTTypeData as String)
        attributeSet.title = recipe.title
        attributeSet.contentDescription = recipe.description
        attributeSet.keywords = recipe.tags + [recipe.cuisineType, recipe.mealType].compactMap { $0 }
        
        if let imageURL = recipe.imageUrl {
            // Add thumbnail
            attributeSet.thumbnailURL = URL(string: imageURL)
        }
        
        let item = CSSearchableItem(
            uniqueIdentifier: recipe.id,
            domainIdentifier: "recipes",
            attributeSet: attributeSet
        )
        
        CSSearchableIndex.default().indexSearchableItems([item]) { error in
            if let error = error {
                print("Spotlight indexing error: \(error)")
            }
        }
    }
    
    static func removeRecipeFromIndex(_ recipeId: String) {
        CSSearchableIndex.default().deleteSearchableItems(withIdentifiers: [recipeId]) { error in
            if let error = error {
                print("Spotlight removal error: \(error)")
            }
        }
    }
}
```

### 4. Apple Watch Companion App
```swift
// WatchOS app for cooking timers and quick recipe access
import WatchKit
import SwiftUI

struct CookingTimerView: View {
    @StateObject private var timerManager = WatchTimerManager()
    
    var body: some View {
        VStack {
            if timerManager.activeTimers.isEmpty {
                Text("No active timers")
                    .foregroundColor(.secondary)
            } else {
                List(timerManager.activeTimers) { timer in
                    TimerRowView(timer: timer)
                }
            }
            
            Button("Add Timer") {
                // Present timer creation interface
            }
        }
        .navigationTitle("Cooking Timers")
    }
}

// Sync timers between iPhone and Apple Watch
class WatchConnectivityManager: NSObject, WCSessionDelegate {
    static let shared = WatchConnectivityManager()
    
    func syncTimers(_ timers: [CookingTimer]) {
        guard WCSession.default.isReachable else { return }
        
        let timerData = timers.map { timer in
            [
                "id": timer.id.uuidString,
                "title": timer.title,
                "duration": timer.duration,
                "startTime": timer.startTime.timeIntervalSince1970
            ]
        }
        
        WCSession.default.sendMessage(["timers": timerData], replyHandler: nil)
    }
}
```

## Development Guidelines

### Code Style and Architecture
1. **SwiftUI First**: Use SwiftUI for all UI components
2. **MVVM Pattern**: Maintain clear separation between View, ViewModel, and Model
3. **Protocol-Oriented**: Use protocols for testability and flexibility
4. **Async/Await**: Use modern concurrency for all async operations
5. **Type Safety**: Leverage Swift's type system for compile-time safety

### Performance Considerations
1. **Lazy Loading**: Implement pagination for large data sets
2. **Image Caching**: Use SDWebImage for efficient image handling
3. **Core Data Optimization**: Use NSFetchedResultsController for UI updates
4. **Background Processing**: Perform sync operations on background queues
5. **Memory Management**: Use weak references to prevent retain cycles

### Error Handling Strategy
```swift
enum AppError: LocalizedError {
    case networkError(Error)
    case authenticationError
    case syncError(Error)
    case dataCorruption
    
    var errorDescription: String? {
        switch self {
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .authenticationError:
            return "Authentication failed. Please log in again."
        case .syncError(let error):
            return "Sync failed: \(error.localizedDescription)"
        case .dataCorruption:
            return "Data corruption detected. Please restart the app."
        }
    }
}

@MainActor
class ErrorHandler: ObservableObject {
    @Published var currentError: AppError?
    @Published var showingError = false
    
    func handle(_ error: Error) {
        if let appError = error as? AppError {
            currentError = appError
        } else {
            currentError = .networkError(error)
        }
        showingError = true
    }
}
```

## Testing Strategy

### Unit Testing
- **ViewModels**: Test all business logic with mock repositories
- **Repositories**: Test API integration with mock network responses
- **Sync Service**: Test conflict resolution and offline scenarios
- **Utilities**: Test helper functions and extensions

### Integration Testing
- **API Integration**: Test actual API calls in controlled environment
- **Core Data Sync**: Test data persistence and sync scenarios
- **Authentication Flow**: Test complete login/logout cycles

### UI Testing
- **Critical Paths**: Test login, recipe creation, grocery management
- **Accessibility**: Verify VoiceOver and accessibility features
- **Performance**: Test with large datasets and poor network conditions

### Test Implementation
```swift
import XCTest
@testable import RecipeManager

class GrocerySyncServiceTests: XCTestCase {
    var syncService: GrocerySyncService!
    var mockAPIClient: MockAPIClient!
    var mockCoreDataManager: MockCoreDataManager!
    
    override func setUp() {
        super.setUp()
        mockAPIClient = MockAPIClient()
        mockCoreDataManager = MockCoreDataManager()
        syncService = GrocerySyncService(
            apiClient: mockAPIClient,
            coreDataManager: mockCoreDataManager
        )
    }
    
    func testSyncGroceries_WithLocalChanges_PushesToServer() async throws {
        // Given: Local changes exist
        let localItem = GroceryItem.mock(isDirty: true)
        mockCoreDataManager.dirtyItems = [localItem]
        
        // When: Sync is performed
        await syncService.syncGroceries()
        
        // Then: Local changes are pushed to server
        XCTAssertTrue(mockAPIClient.updateGroceryItemCalled)
        XCTAssertFalse(localItem.isDirty)
    }
    
    func testHandleRemoteUpdate_WithNewerServerVersion_UpdatesLocal() async {
        // Given: Local item with older version
        let localItem = GroceryItem.mock(serverVersion: 1)
        mockCoreDataManager.existingItems = [localItem.id: localItem]
        
        // When: Remote update with newer version
        let remoteUpdate = APIGroceryItem.mock(id: localItem.id, serverVersion: 2)
        await syncService.handleRemoteUpdate(GroceryUpdateEvent(type: .updated, item: remoteUpdate))
        
        // Then: Local item is updated
        XCTAssertEqual(localItem.serverVersion, 2)
    }
}
```

## Deployment & Distribution

### App Store Connect Configuration
1. **Bundle Identifier**: `com.getzesty.recipemanager.ios`
2. **App Categories**: Food & Drink, Productivity
3. **Target Audience**: 4+ (suitable for all ages)
4. **Required Permissions**:
   - Camera (for recipe photos)
   - Photo Library (for image selection)
   - Network (for API communication)
   - Motion (for shake gestures)

### Build Configuration
```swift
// Release configuration
#if RELEASE
let apiBaseURL = "https://www.getzesty.food"
let logLevel = LogLevel.error
#else
let apiBaseURL = "https://staging.getzesty.food"
let logLevel = LogLevel.debug
#endif
```

### Privacy and Security
1. **Data Privacy**: Clear privacy policy explaining data usage
2. **Keychain Security**: Secure token storage with biometric protection
3. **Network Security**: Certificate pinning for API calls
4. **Local Data**: Core Data encryption for sensitive information

### App Store Optimization
1. **Screenshots**: Showcase key features across different device sizes
2. **App Preview**: Video demonstrating AI recipe generation and grocery sync
3. **Keywords**: "recipe manager", "cooking", "meal planning", "grocery list", "AI recipes"
4. **Description**: Focus on unique features like AI chat and cross-platform sync

This comprehensive specification provides a complete roadmap for building the iOS version of your Recipe Manager app with enhanced Core Data sync capabilities and full feature parity with the React Native version. The API-first architecture ensures consistency across all platforms while leveraging iOS-specific capabilities for an optimal user experience.
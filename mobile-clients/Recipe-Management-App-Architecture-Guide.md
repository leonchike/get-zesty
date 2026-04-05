# Recipe Management App - Comprehensive Architecture Guide

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Authentication System](#authentication-system)
5. [API Architecture](#api-architecture)
6. [App Navigation & Views](#app-navigation--views)
7. [Core Features](#core-features)
8. [State Management](#state-management)
9. [Data Flow](#data-flow)
10. [UI Components & Design](#ui-components--design)
11. [iOS Development Considerations](#ios-development-considerations)

## Overview

The Recipe Management App is a comprehensive mobile application built with React Native and Expo, designed to help users manage recipes, create grocery lists, and interact with AI-powered recipe generation. The app features a sophisticated architecture with modern React patterns, TypeScript, and a feature-based organization structure.

### Key App Capabilities
- **Recipe Management**: Create, edit, view, and organize recipes
- **AI Recipe Generation**: Generate recipes using AI with iterative chat interface
- **Recipe Scraping**: Import recipes from URLs
- **Grocery List Management**: Convert recipe ingredients to grocery lists with real-time updates
- **Image Generation**: AI-powered recipe image generation
- **User Authentication**: Email/password and Google OAuth authentication
- **Dark/Light Mode**: Full theme support
- **Responsive Design**: Optimized for phones and tablets

## Technology Stack

### Core Technologies
- **React Native 0.76.3**: Cross-platform mobile development
- **Expo SDK 52**: Development platform and toolchain
- **TypeScript**: Type safety and better developer experience
- **Expo Router 4**: File-based routing system

### State Management
- **Zustand 5.0.5**: Lightweight state management for UI state
- **React Query (@tanstack/react-query 5.79.0)**: Server state management, caching, and synchronization
- **React Hook Form 7.56.4**: Form state management

### Styling & UI
- **NativeWind 4.1.23**: Tailwind CSS for React Native
- **@gorhom/bottom-sheet 5.1.5**: Bottom sheet components
- **Expo Linear Gradient**: Gradient backgrounds
- **React Native Reanimated 3.16.1**: Smooth animations

### Backend Integration
- **Axios 1.9.0**: HTTP client for API requests
- **JWT Decode 4.0.0**: JWT token handling
- **@microsoft/fetch-event-source**: Server-sent events for real-time updates

### Authentication
- **@react-native-google-signin/google-signin**: Google OAuth
- **Expo Auth Session**: OAuth flow handling
- **@react-native-async-storage/async-storage**: Secure token storage

### Additional Libraries
- **React Native Gesture Handler**: Touch gestures
- **React Native Safe Area Context**: Safe area handling
- **Expo Haptics**: Haptic feedback
- **React Native Shake**: Shake gestures for undo functionality

## Project Structure

The app follows a feature-based architecture pattern:

```
recipe-manager-mobile-react-native/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Authentication screens
│   ├── (tabs)/                   # Main app tabs
│   └── _layout.tsx               # Root layout with providers
├── components/                   # Reusable UI components
├── features/                     # Feature-based modules
│   ├── auth/                     # Authentication components
│   ├── cooking-experience/       # Guided cooking interface
│   ├── create-edit-recipe/       # Recipe creation/editing
│   ├── groceries/                # Grocery list management
│   ├── pinned-recipes/           # Recipe pinning functionality
│   ├── recipe-chat/              # AI chat for recipe generation
│   ├── recipe-view/              # Recipe display modal
│   ├── recipes-index/            # Recipe listing and search
│   └── settings/                 # User settings
├── context/                      # React context providers
├── stores/                       # Global Zustand stores
├── lib/                          # Utilities and types
├── hooks/                        # Custom React hooks
└── assets/                       # Images, fonts, icons
```

### Feature-Based Organization
Each feature follows a consistent structure:
```
feature/
├── components/           # Feature-specific components
├── hooks/               # Feature-specific hooks
├── stores/              # Feature-specific Zustand stores
├── actions/             # API calls and business logic
└── lib/                 # Feature utilities
```

## Authentication System

The app implements a robust authentication system supporting multiple authentication methods.

### Authentication Methods
1. **Email/Password Authentication**
   - User registration with email verification
   - Secure password-based login
   - Password reset functionality

2. **Google OAuth**
   - Google Sign-In integration
   - Automatic account creation/linking
   - Secure token exchange

### Authentication Flow
```typescript
// AuthContext provides authentication state and methods
interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<{token: string; user: User} | null>;
  signInWithEmail: (email: string, password: string) => Promise<{token: string; user: User} | null>;
  signupWithEmail: (email: string, password: string, name: string) => Promise<{token: string; user: User} | null>;
  logout: () => Promise<void>;
}
```

### Token Management
- **JWT Tokens**: Used for API authentication
- **Automatic Refresh**: Periodic token validation
- **Secure Storage**: AsyncStorage for token persistence
- **Token Expiration**: Automatic logout on token expiry

### Route Protection
- Unauthenticated users are redirected to login screen
- Tab navigation only accessible to authenticated users
- Per-route authentication checks

## API Architecture

The app communicates with a backend API for all data operations.

### API Client Configuration
```typescript
// Centralized axios client with interceptors
const backendApi = axios.create({
  baseURL: BACKEND_URL, // Production: getzesty.food
});

// Automatic JWT token attachment
backendApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Key API Endpoints

#### Authentication Endpoints
- `POST /api/mobile-auth/login` - Email/password login
- `POST /api/mobile-auth/register` - User registration
- `POST /api/mobile-auth/google` - Google OAuth
- `POST /api/mobile-auth/set-password` - Set password for OAuth users

#### Recipe Management
- `GET /api/mobile/recipe-search` - Search recipes with filters
- `GET/POST/PUT/DELETE /api/mobile/recipe` - CRUD operations
- `POST /api/mobile/recipe-scraper` - Import recipe from URL
- `POST /api/mobile/recipe-ai-generate` - AI recipe generation
- `POST /api/mobile/recipe-chat` - AI chat for recipe iteration

#### Grocery Management
- `GET /api/mobile-groceries-updates` - Real-time grocery updates (SSE)
- `POST/PATCH/DELETE /api/mobile-grocery-update` - Grocery CRUD
- `POST /api/mobile/add-groceries-from-recipe` - Add recipe ingredients to grocery list

#### User Management
- `GET /api/mobile/user-get-current` - Get current user
- `PUT /api/mobile/user-profile-update` - Update user profile
- `POST /api/mobile/user-deactivate` - Deactivate account

#### Additional Features
- `GET /api/mobile/pinned-recipes` - Get pinned recipes
- `POST /api/mobile/test-image-generation` - Generate AI images
- `GET /api/mobile/cloudflare-upload-url` - Image upload URLs

## App Navigation & Views

The app uses Expo Router with a tab-based navigation structure.

### Root Layout Structure
```
app/
├── _layout.tsx              # Root layout with providers
├── index.tsx                # Landing/splash screen
├── (auth)/                  # Authentication flow
│   ├── _layout.tsx
│   ├── log-in.tsx
│   └── register.tsx
└── (tabs)/                  # Main app navigation
    ├── _layout.tsx          # Tab navigation setup
    ├── index/               # Recipes tab
    │   ├── _layout.tsx
    │   ├── index.tsx        # Recipe list view
    │   └── recipe/
    │       ├── [id].tsx     # Recipe view modal
    │       └── new.tsx      # Create recipe
    └── groceries.tsx        # Grocery list tab
```

### Tab Navigation
1. **Recipes Tab** (`/index`)
   - Recipe list with search and filters
   - Pinned recipes section
   - Grid/list view toggle
   - Pull-to-refresh functionality

2. **Groceries Tab** (`/groceries`)
   - Sectioned grocery list
   - Add/edit/complete grocery items
   - Shake-to-undo functionality
   - Real-time updates via SSE

### Modal System
- **Recipe View Modal**: Full-screen recipe display
- **Create/Edit Recipe Modal**: Recipe form interface
- **Cooking Experience Modal**: Step-by-step cooking guide
- **Settings Modal**: User settings and profile
- **Filter Modal**: Recipe search filters

## Core Features

### 1. Recipe Management

#### Recipe Creation & Editing
- **Rich Form Interface**: Multi-step recipe creation
- **AI Assistance**: Chat-based recipe generation
- **URL Scraping**: Import recipes from websites
- **Image Upload**: Support for recipe images
- **Comprehensive Fields**: 
  - Title, description, ingredients, instructions
  - Prep/cook/rest times, difficulty, servings
  - Cuisine type, meal type, dietary restrictions
  - Equipment, notes, tags

#### Recipe Display
- **Modal-based Viewing**: Full-screen recipe display
- **Sectioned Content**: Organized recipe information
- **Interactive Elements**: 
  - Ingredient quantity adjustment
  - Step-by-step instructions
  - Cooking mode with timers
  - Share functionality

#### Recipe Search & Discovery
- **Advanced Search**: Text-based recipe search
- **Filter System**: Filter by cuisine, meal type, difficulty, etc.
- **Pinned Recipes**: Quick access to favorite recipes
- **Infinite Scrolling**: Efficient loading of large recipe lists

### 2. AI-Powered Recipe Generation

#### Recipe Chat System
- **Interactive AI Chat**: Conversational recipe creation
- **Single Recipe Constraint**: One recipe per chat session
- **Iterative Improvements**: Modify recipes through chat
- **Recipe Variations**: Scale servings, dietary modifications
- **Save Functionality**: Save generated recipes to library

#### AI Image Generation
- **Automatic Image Creation**: AI-generated recipe images
- **Background Processing**: Non-blocking image generation
- **Professional Quality**: Food photography style images
- **Cloudflare Integration**: CDN delivery for performance

### 3. Grocery List Management

#### Smart Grocery Lists
- **Recipe Integration**: Add recipe ingredients to grocery list
- **Sectioned Organization**: Organize by grocery store sections
- **Real-time Updates**: Live synchronization across devices
- **Status Management**: Active, completed, deleted states

#### Advanced Grocery Features
- **Shake to Undo**: Gesture-based undo functionality
- **Quantity Management**: Track item quantities and units
- **Smart Parsing**: Automatic ingredient parsing
- **Section Assignment**: Auto-categorize grocery items

### 4. Cooking Experience

#### Guided Cooking Mode
- **Step-by-step Instructions**: Progressive recipe guidance
- **Ingredient Tracking**: Mark ingredients as used
- **Timer Integration**: Built-in cooking timers
- **Progress Tracking**: Visual progress indicators
- **Hands-free Mode**: Voice-controlled navigation

### 5. User Settings & Profile

#### Account Management
- **Profile Editing**: Update user information
- **Password Management**: Change passwords securely
- **Account Deactivation**: Secure account removal
- **Data Export**: Export user recipes

#### App Preferences
- **Theme Selection**: Dark/light mode toggle
- **Notification Settings**: Control app notifications
- **Privacy Settings**: Data sharing preferences

## State Management

The app uses a hybrid state management approach combining Zustand for UI state and React Query for server state.

### Zustand Stores (UI State)

#### Global UI Store
```typescript
interface GlobalUIStore {
  isFilterModalVisible: boolean;
  isCookingExperienceModalVisible: boolean;
  selectedRecipeForCookingExperience: Recipe | null;
  isAddIngredientsFromRecipeModalVisible: boolean;
  // ... other modal states
}
```

#### Feature-Specific Stores
- **Recipe Form Store**: Form state for recipe creation/editing
- **Recipe Chat Store**: Chat messages and AI interaction state
- **Cooking Experience Store**: Progress tracking during cooking
- **Grocery Store**: Grocery list UI state and optimistic updates

### React Query (Server State)

#### Query Management
- **Recipe Queries**: Fetch, cache, and sync recipe data
- **Infinite Queries**: Paginated recipe loading
- **Mutation Handling**: Create, update, delete operations
- **Background Refetching**: Keep data fresh automatically

#### Caching Strategy
- **Stale-while-revalidate**: Show cached data while fetching updates
- **Optimistic Updates**: Immediate UI updates for better UX
- **Error Boundaries**: Graceful error handling and recovery

## Data Flow

### Recipe Creation Flow
1. User navigates to recipe creation
2. Form state managed by Zustand + React Hook Form
3. AI assistance available through chat modal
4. Form submission triggers React Query mutation
5. Optimistic UI updates provide immediate feedback
6. Background image generation initiated
7. Cache invalidation ensures data consistency

### Grocery List Flow
1. User adds items or imports from recipe
2. Optimistic updates for immediate feedback
3. SSE connection provides real-time updates
4. Shake gesture detection for undo functionality
5. Automatic section categorization
6. Status changes sync across all devices

### Authentication Flow
1. User authentication through AuthContext
2. JWT token stored securely in AsyncStorage
3. Automatic token attachment to API requests
4. Periodic token validation and refresh
5. Route protection based on authentication state

## UI Components & Design

### Design System

#### Theming
- **Dark/Light Mode**: Full theme support
- **Color System**: Consistent color palette
- **Typography**: Hierarchical text styles
- **Spacing**: Consistent spacing scale

#### Component Library
- **Form Components**: Input fields, pickers, switches
- **Navigation**: Tab bars, modal headers
- **Display**: Cards, lists, empty states
- **Feedback**: Loading states, error messages, toasts

### Responsive Design
- **Device Detection**: iPhone, iPad, and Android support
- **Adaptive Layouts**: Different layouts for tablet vs phone
- **Safe Areas**: Proper handling of device safe areas
- **Keyboard Handling**: Automatic keyboard avoidance

### Accessibility
- **Screen Reader Support**: Semantic markup and labels
- **Touch Targets**: Properly sized interactive elements
- **Color Contrast**: Accessible color combinations
- **Focus Management**: Proper focus flow for keyboard navigation

## iOS Development Considerations

### Key Architectural Patterns for iOS Translation

#### 1. Navigation Architecture
**React Native Pattern:**
- Expo Router with file-based routing
- Tab navigation with nested stack navigation
- Modal presentation for detailed views

**iOS Translation:**
- Use `UITabBarController` for main navigation
- `UINavigationController` for stack navigation within tabs
- Modal presentation with `UIModalPresentationStyle`

#### 2. State Management
**React Native Pattern:**
- Zustand for local UI state
- React Query for server state and caching

**iOS Translation:**
- Use **SwiftUI's `@StateObject` and `@ObservedObject`** or **Combine framework**
- Implement **Repository pattern** for API layer
- Consider **Core Data** for local caching similar to React Query

#### 3. Feature Organization
**React Native Pattern:**
- Feature-based folder structure
- Each feature contains components, hooks, stores, actions

**iOS Translation:**
- Create **feature modules** as separate Swift packages or groups
- Use **MVVM or VIPER architecture** for feature organization
- Implement **protocol-oriented programming** for feature interfaces

#### 4. Authentication System
**React Native Implementation:**
- JWT tokens with AsyncStorage
- Automatic token refresh
- OAuth integration

**iOS Translation:**
- Use **Keychain Services** for secure token storage
- Implement **OAuth flows** with `ASWebAuthenticationSession`
- Create **AuthenticationManager** singleton for token handling

#### 5. API Layer
**React Native Pattern:**
- Axios with interceptors for authentication
- Centralized API client configuration

**iOS Translation:**
- Use **URLSession** with custom configuration
- Implement **request/response interceptors** through `URLProtocol`
- Create **APIClient** with automatic token injection

#### 6. Real-time Updates
**React Native Implementation:**
- Server-Sent Events for grocery list updates
- EventSource for real-time data

**iOS Translation:**
- Use **URLSessionDataTask** for SSE implementation
- Consider **WebSocket** for bidirectional communication
- Implement **background app refresh** for data synchronization

#### 7. Image Handling
**React Native Pattern:**
- Image picking with expo-image-picker
- Cloudflare integration for image storage

**iOS Translation:**
- Use **PHPickerViewController** for image selection
- Implement **image compression** and upload functionality
- Cache images with **SDWebImage** or native caching

#### 8. Offline Support
**React Native Implementation:**
- React Query caching for offline data access
- Optimistic updates for immediate feedback

**iOS Translation:**
- Use **Core Data** for local data persistence
- Implement **sync manager** for offline/online synchronization
- Handle **network reachability** with Network framework

### Recommended iOS Architecture

#### 1. Project Structure
```
RecipeManager/
├── App/                     # App lifecycle and configuration
├── Features/                # Feature modules
│   ├── Authentication/
│   ├── Recipes/
│   ├── Groceries/
│   └── Settings/
├── Shared/                  # Shared components and utilities
│   ├── API/                 # Network layer
│   ├── Models/              # Data models
│   ├── Extensions/          # Swift extensions
│   └── UI/                  # Reusable UI components
└── Resources/               # Assets, colors, strings
```

#### 2. Core Technologies for iOS
- **SwiftUI** for modern, declarative UI
- **Combine** for reactive programming
- **Core Data** for local data persistence
- **URLSession** for networking
- **Keychain Services** for secure storage

#### 3. Third-party Libraries
- **Alamofire** for advanced networking features
- **SDWebImage** for image loading and caching
- **GoogleSignIn** for OAuth authentication
- **SwiftUICharts** for data visualization (if needed)

#### 4. Key Implementation Areas

##### Authentication Manager
```swift
class AuthenticationManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    private let apiClient: APIClient
    private let keychainManager: KeychainManager
    
    func signIn(email: String, password: String) async throws
    func signInWithGoogle() async throws
    func refreshToken() async throws
    func signOut()
}
```

##### API Client
```swift
class APIClient {
    private let session: URLSession
    private let baseURL: URL
    
    func request<T: Codable>(_ endpoint: APIEndpoint) async throws -> T
    func upload(data: Data, to endpoint: APIEndpoint) async throws -> UploadResponse
    func openSSEConnection(to endpoint: APIEndpoint) -> AsyncThrowingStream<SSEEvent, Error>
}
```

##### Recipe Management
```swift
class RecipeManager: ObservableObject {
    @Published var recipes: [Recipe] = []
    @Published var pinnedRecipes: [Recipe] = []
    
    private let apiClient: APIClient
    private let coreDataManager: CoreDataManager
    
    func fetchRecipes() async throws
    func createRecipe(_ recipe: Recipe) async throws
    func updateRecipe(_ recipe: Recipe) async throws
    func deleteRecipe(id: String) async throws
}
```

#### 5. Migration Strategy
1. **Start with Core Features**: Implement authentication and basic recipe viewing
2. **Incremental Development**: Add features one by one, testing thoroughly
3. **API Compatibility**: Ensure iOS app works with existing backend APIs
4. **Design Consistency**: Match React Native app's design and user experience
5. **Performance Optimization**: Leverage iOS-specific optimizations

#### 6. iOS-Specific Enhancements
- **Widgets**: Home screen widgets for quick recipe access
- **Shortcuts**: Siri Shortcuts for common actions
- **Spotlight Integration**: Search recipes from iOS search
- **Handoff**: Continue tasks between iOS devices
- **Apple Watch**: Companion app for cooking timers

This architecture guide provides a comprehensive foundation for building the iOS version while maintaining consistency with the React Native app's functionality and user experience.
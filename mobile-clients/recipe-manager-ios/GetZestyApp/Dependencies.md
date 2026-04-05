# iOS App Dependencies

## Required Swift Package Manager Dependencies

Add these dependencies to your Xcode project via File → Add Package Dependency:

### 1. SDWebImage
**URL:** `https://github.com/SDWebImage/SDWebImage`
**Version:** 5.18.0+
**Purpose:** Efficient image loading and caching

### 2. SwiftSoup
**URL:** `https://github.com/scinfu/SwiftSoup`
**Version:** 2.6.0+
**Purpose:** HTML parsing for recipe scraping

## Future Dependencies (Phase 4)

### Google Sign-In (Later Version)
**URL:** `https://github.com/google/GoogleSignIn-iOS`
**Version:** 7.0.0+
**Purpose:** Google OAuth authentication (to be added in later version)

## Project Configuration

### 1. Info.plist Configuration

Add these entries to your Info.plist:

```xml
<!-- Camera and Photo Library Permissions -->
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera to take photos of your recipes</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to your photo library to select recipe images</string>

<!-- Motion Permission for Shake Gestures -->
<key>NSMotionUsageDescription</key>
<string>This app uses motion detection for shake-to-undo functionality</string>

<!-- Network Access -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>getzesty.food</key>
        <dict>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <false/>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

### 2. Build Settings

Add these build settings:

- **Other Linker Flags:** `-ObjC`
- **Framework Search Paths:** `$(inherited)`
- **Header Search Paths:** `$(inherited)`

### 3. Capabilities

Enable these capabilities in your app target:

- **App Groups** (for future widget support)
- **Background Modes:** 
  - Background processing
  - Background app refresh
- **Push Notifications** (for future notifications)

## Installation Instructions

### Step 1: Add Package Dependencies

1. Open Xcode project
2. Go to File → Add Package Dependency
3. Add each package URL listed above
4. Choose "Up to Next Major Version" for version requirements

### Step 2: Test Installation

Build and run the project to ensure all dependencies are properly configured.

## Troubleshooting

### Common Issues

1. **Build errors:**
   - Clean build folder (Cmd+Shift+K)
   - Delete derived data
   - Restart Xcode

2. **Core Data errors:**
   - Ensure RecipeManager.xcdatamodeld is in project
   - Check Core Data model version compatibility

## Future Google Sign-In Setup (Phase 4)

When ready to add Google Sign-In:

1. Create Firebase project at https://console.firebase.google.com
2. Add iOS app to Firebase project
3. Download GoogleService-Info.plist
4. Add Google Sign-In URL scheme to Info.plist
5. Uncomment Google Sign-In code in AuthenticationManager

### Minimum iOS Version

- **Target:** iOS 16.0+
- **Deployment Target:** iOS 16.0

This ensures compatibility with modern SwiftUI features and APIs used throughout the app.
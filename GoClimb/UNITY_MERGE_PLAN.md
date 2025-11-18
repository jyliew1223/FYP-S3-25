# Unity Integration Merge Plan

## Overview
Merging Unity AR functionality from `src_merge` into `src` while preserving existing functionality.

## Unity Configuration Requirements

### 1. Gradle Properties (android/gradle.properties)
**Action Required**: Update the following paths to match your Unity installation:
- `unity.androidSdkPath` - Path to Unity's Android SDK
- `unity.androidNdkPath` - Path to Unity's Android NDK  
- `unity.androidNdkVersion` - NDK version (must match build.gradle)
- `unity.jdkPath` - Path to Unity's JDK

**Current values** (from lead coder's setup):
```
unity.androidSdkPath=C:/Personal/Software/Unity/6000.2.6f2/Editor/Data/PlaybackEngines/AndroidPlayer/SDK
unity.androidNdkPath=C:/Personal/Software/Unity/6000.2.6f2/Editor/Data/PlaybackEngines/AndroidPlayer/SDK/ndk/27.1.12297006
unity.androidNdkVersion=27.1.12297006
unity.jdkPath=C:/Personal/Software/Unity/6000.2.6f2/Editor/Data/PlaybackEngines/AndroidPlayer/OpenJDK
```

### 2. Build Gradle (android/build.gradle)
**Action Required**: Ensure `ndkVersion` matches `unity.androidNdkVersion` in gradle.properties
- Current: `ndkVersion = "27.2.12479018"` 
- Should be: `ndkVersion = "27.1.12297006"` (or match your Unity NDK version)

## Files to Merge

### New Files (Unity-specific)
1. **Components**
   - `src/components/UnityViewerDirect.js` - Unity viewer component
   - `src/components/ModelPicker.js` - Model selection component

2. **Screens**
   - `src/screens/UnityARScreen.js` - Main Unity AR screen
   - `src/screens/ARCragList.js` - AR crag list screen
   - `src/screens/RouteDataManager.js` - Route data management

3. **Services**
   - `src/services/storage/RouteDataStorage.js` - Local route data storage
   - `src/services/api/ModelRouteDataService.js` - Model route data API
   - `src/services/firebase/FileDownloadHelper.js` - Firebase file downloads
   - `src/services/firebase/FirebaseStorageHelper.js` - Firebase storage helper

4. **Utils**
   - `src/utils/FullscreenHelper.js` - Fullscreen mode helper
   - `src/utils/LocalModelChecker.js` - Local model file checker

5. **Constants**
   - `src/constants/folder_path.js` - File path constants

### Files to Update (Merge changes)
1. **Navigation**
   - `src/navigation/RootNavigator.js` - Add Unity AR routes

2. **Screens** (Update existing)
   - `src/screens/AR.js` - Replace placeholder with Unity integration
   - `src/screens/RouteDetails.js` - Add AR navigation

### Dependencies to Add
```json
"@azesmway/react-native-unity": "^version",
"react-native-fs": "^version"
```

## Merge Strategy

### Phase 1: Copy New Files
1. Copy Unity-specific components
2. Copy Unity-specific screens
3. Copy Unity services and utilities
4. Copy Unity constants

### Phase 2: Update Existing Files
1. Update RootNavigator to include Unity routes
2. Update AR.js to use Unity
3. Update RouteDetails to navigate to Unity AR

### Phase 3: Configuration
1. Update package.json with Unity dependencies
2. Update gradle.properties with your Unity paths
3. Update build.gradle ndkVersion
4. Run npm install

### Phase 4: Testing
1. Test Unity AR screen navigation
2. Test model loading
3. Test route data storage
4. Test AR functionality

## Notes
- Your existing src files take priority
- Unity integration is additive - won't break existing features
- UnityExport folder already exists in android/
- Gradle properties already configured (just need path updates)

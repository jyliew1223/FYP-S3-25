# Next Steps - Unity Integration

## ✅ What's Been Done

All Unity files have been successfully merged into your `src` folder. The merge is complete!

## 🚀 What You Need to Do Now

### Step 1: Install Dependencies

Open your terminal in the `GoClimb` directory and run:

```bash
npm install @azesmway/react-native-unity react-native-fs
```

### Step 2: Update Unity Paths in Gradle

**CRITICAL:** Open `android/gradle.properties` and find these lines (around line 50-60):

```properties
unity.androidSdkPath=C:/Personal/Software/Unity/6000.2.6f2/Editor/Data/PlaybackEngines/AndroidPlayer/SDK
unity.androidNdkPath=C:/Personal/Software/Unity/6000.2.6f2/Editor/Data/PlaybackEngines/AndroidPlayer/SDK/ndk/27.1.12297006
unity.androidNdkVersion=27.1.12297006
unity.jdkPath=C:/Personal/Software/Unity/6000.2.6f2/Editor/Data/PlaybackEngines/AndroidPlayer/OpenJDK
```

**Replace them with YOUR Unity installation paths.** 

To find your Unity path:
1. Open Unity Hub
2. Go to Installs
3. Click the gear icon next to your Unity version
4. Click "Show in Explorer" (Windows) or "Show in Finder" (Mac)
5. Use that path to construct the full paths above

**Example for Windows:**
```properties
unity.androidSdkPath=C:/Program Files/Unity/Hub/Editor/6000.2.6f2/Editor/Data/PlaybackEngines/AndroidPlayer/SDK
unity.androidNdkPath=C:/Program Files/Unity/Hub/Editor/6000.2.6f2/Editor/Data/PlaybackEngines/AndroidPlayer/SDK/ndk/27.1.12297006
unity.androidNdkVersion=27.1.12297006
unity.jdkPath=C:/Program Files/Unity/Hub/Editor/6000.2.6f2/Editor/Data/PlaybackEngines/AndroidPlayer/OpenJDK
```

**Note:** The NDK version (27.1.12297006) has already been updated in `android/build.gradle` to match.

### Step 3: Clean and Rebuild

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Step 4: Test the AR Feature

1. Open the app
2. Navigate to the AR screen (bottom navigation or from routes)
3. Tap "Start AR Experience"
4. Select a crag
5. Select a model (download if needed)
6. Unity AR should launch!

## 📋 Quick Reference

### Files Added:
- Components: `UnityViewerDirect.js`, `ModelPicker.js`
- Screens: `UnityARScreen.js`, `ARCragList.js`, `RouteDataManager.js`
- Services: `ModelRouteDataService.js`, `RouteDataStorage.js`, `FileDownloadHelper.js`, `FirebaseStorageHelper.js`
- Utils: `FullscreenHelper.js`, `LocalModelChecker.js`
- Constants: `folder_path.js`

### Files Updated:
- `src/navigation/RootNavigator.js` - Added Unity routes
- `src/screens/AR.js` - Added AR navigation
- `src/constants/api.js` - Added MODEL_ROUTE_DATA endpoints
- `android/build.gradle` - Updated ndkVersion

### Files NOT Modified:
- All your existing screens, components, and services remain unchanged
- Your existing functionality is fully preserved

## ❓ Troubleshooting

**Build fails:**
- Double-check Unity paths in `gradle.properties`
- Ensure ndkVersion matches in both files
- Run `./gradlew clean` again

**Unity doesn't load:**
- Check console logs for errors
- Verify UnityExport folder exists in `android/`
- Ensure model files are downloaded

**Can't find Unity path:**
- Open Unity Hub → Installs → Click gear icon → "Show in Explorer/Finder"

## 📚 Documentation

See these files for more details:
- `UNITY_MERGE_COMPLETE.md` - Full merge summary
- `UNITY_MERGE_INSTRUCTIONS.md` - Detailed instructions
- `UNITY_MERGE_PLAN.md` - Original merge plan

## ✨ You're Almost There!

Just install the dependencies, update the Unity paths, and rebuild. The Unity AR integration will be ready to use!

# Unity Integration Merge Instructions

## ⚠️ IMPORTANT: Configuration Required

Before running the app, you MUST update these paths in `android/gradle.properties` to match YOUR Unity installation:

```properties
unity.androidSdkPath=YOUR_PATH_HERE
unity.androidNdkPath=YOUR_PATH_HERE  
unity.androidNdkVersion=YOUR_VERSION_HERE
unity.jdkPath=YOUR_PATH_HERE
```

Also update `android/build.gradle`:
```groovy
ndkVersion = "YOUR_VERSION_HERE"  // Must match unity.androidNdkVersion
```

## Step-by-Step Merge Process

### Phase 1: Install Dependencies

1. Add Unity and file system packages:
```bash
npm install @azesmway/react-native-unity react-native-fs
```

2. Link native modules (if needed):
```bash
npx react-native link @azesmway/react-native-unity
npx react-native link react-native-fs
```

### Phase 2: Copy Unity Files

I'll copy the following files for you:

**Components:**
- `src/components/UnityViewerDirect.js` ✓
- `src/components/ModelPicker.js` ✓

**Screens:**
- `src/screens/UnityARScreen.js` ✓
- `src/screens/ARCragList.js` ✓
- `src/screens/RouteDataManager.js`

**Services:**
- `src/services/storage/RouteDataStorage.js`
- `src/services/api/ModelRouteDataService.js`
- `src/services/firebase/FileDownloadHelper.js`
- `src/services/firebase/FirebaseStorageHelper.js`

**Utils:**
- `src/utils/FullscreenHelper.js`
- `src/utils/LocalModelChecker.js`

**Constants:**
- `src/constants/folder_path.js`

### Phase 3: Update Existing Files

**Navigation (RootNavigator.js):**
- Add UnityAR screen route
- Add ARCragList screen route

**AR Screen (AR.js):**
- Update to navigate to ARCragList instead of showing placeholder

**RouteDetails Screen:**
- Add AR button to launch Unity AR experience

### Phase 4: Configuration Updates

1. Update `android/gradle.properties` with your Unity paths
2. Update `android/build.gradle` ndkVersion to match
3. Clean and rebuild:
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## Testing Checklist

- [ ] Dependencies installed
- [ ] Unity paths configured in gradle.properties
- [ ] ndkVersion matches in build.gradle
- [ ] App builds successfully
- [ ] Can navigate to AR Crag List
- [ ] Can select a crag
- [ ] Can select a model
- [ ] Unity AR screen launches
- [ ] 3D model loads in AR
- [ ] Can interact with AR scene

## Troubleshooting

**Build fails with NDK error:**
- Check that ndkVersion in build.gradle matches unity.androidNdkVersion in gradle.properties
- Verify Unity NDK path is correct

**Unity doesn't load:**
- Check UnityExport folder exists in android/
- Verify model files are downloaded
- Check console logs for Unity errors

**Model not found:**
- Ensure model is downloaded via ModelPicker
- Check file permissions
- Verify download_urls_json is valid

## File Structure After Merge

```
src/
├── components/
│   ├── BottomBar.js (existing)
│   ├── ModelPicker.js (new)
│   └── UnityViewerDirect.js (new)
├── constants/
│   ├── api.js (existing)
│   └── folder_path.js (new)
├── screens/
│   ├── AR.js (updated)
│   ├── ARCragList.js (new)
│   ├── RouteDetails.js (updated)
│   └── UnityARScreen.js (new)
├── services/
│   ├── api/
│   │   ├── CragService.js (existing)
│   │   └── ModelRouteDataService.js (new)
│   ├── firebase/
│   │   ├── FileDownloadHelper.js (new)
│   │   └── FirebaseStorageHelper.js (new)
│   └── storage/
│       └── RouteDataStorage.js (new)
└── utils/
    ├── FullscreenHelper.js (new)
    ├── LocalModelChecker.js (new)
    └── gradeConverter.js (existing)
```

## Next Steps

1. I'll copy all the Unity files to your src folder
2. I'll update the necessary existing files
3. You'll need to:
   - Install the npm packages
   - Update the gradle configuration with your Unity paths
   - Rebuild the app

Ready to proceed?

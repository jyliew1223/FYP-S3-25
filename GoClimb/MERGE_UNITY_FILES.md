# Unity Files Merge Summary

## Files Successfully Copied ✅

1. **Components:**
   - `src/components/UnityViewerDirect.js` ✅

2. **Services:**
   - `src/services/storage/RouteDataStorage.js` ✅
   - `src/services/api/ModelRouteDataService.js` ✅

3. **Utils:**
   - `src/utils/FullscreenHelper.js` ✅
   - `src/utils/LocalModelChecker.js` ✅

4. **Constants:**
   - `src/constants/folder_path.js` ✅

## Files Remaining to Copy

Due to the large number of files, I'll provide you with a PowerShell script to copy the remaining files:

```powershell
# Run this from the GoClimb directory

# Copy ModelPicker component
Copy-Item "src_merge/components/ModelPicker.js" "src/components/ModelPicker.js" -Force

# Copy screens
Copy-Item "src_merge/screens/UnityARScreen.js" "src/screens/UnityARScreen.js" -Force
Copy-Item "src_merge/screens/ARCragList.js" "src/screens/ARCragList.js" -Force
Copy-Item "src_merge/screens/RouteDataManager.js" "src/screens/RouteDataManager.js" -Force

# Create firebase directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "src/services/firebase"

# Copy Firebase helpers
Copy-Item "src_merge/services/firebase/FileDownloadHelper.js" "src/services/firebase/FileDownloadHelper.js" -Force
Copy-Item "src_merge/services/firebase/FirebaseStorageHelper.js" "src/services/firebase/FirebaseStorageHelper.js" -Force

Write-Host "✅ All Unity files copied successfully!" -ForegroundColor Green
```

## Manual Updates Required

### 1. Update `src/constants/api.js`

Add these endpoints:

```javascript
MODEL_ROUTE_DATA: {
  CREATE: 'model_route_data/create/',
  DELETE: 'model_route_data/delete/',
  GET_BY_USER_ID: 'model_route_data/get_by_user_id/',
  GET_BY_MODEL_ID: 'model_route_data/get_by_model_id/',
},
```

### 2. Update `src/navigation/RootNavigator.js`

Add these routes inside your Stack.Navigator:

```javascript
<Stack.Screen 
  name="UnityAR" 
  component={UnityARScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="ARCragList" 
  component={ARCragList}
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="RouteDataManager" 
  component={RouteDataManager}
  options={{ title: 'Route Data Manager' }}
/>
```

And add imports:

```javascript
import UnityARScreen from '../screens/UnityARScreen';
import ARCragList from '../screens/ARCragList';
import RouteDataManager from '../screens/RouteDataManager';
```

### 3. Update `src/screens/AR.js`

Replace the placeholder content with navigation to ARCragList:

```javascript
const handleARPress = () => {
  navigation.navigate('ARCragList');
};

// Add a button in the UI:
<TouchableOpacity 
  onPress={handleARPress}
  style={[styles.arButton, { backgroundColor: colors.accent }]}
>
  <Text style={styles.arButtonText}>Start AR Experience</Text>
</TouchableOpacity>
```

### 4. Install Dependencies

```bash
npm install @azesmway/react-native-unity react-native-fs
```

### 5. Update Gradle Configuration

**android/gradle.properties:**
Update these paths to YOUR Unity installation:
```properties
unity.androidSdkPath=YOUR_PATH_HERE
unity.androidNdkPath=YOUR_PATH_HERE
unity.androidNdkVersion=YOUR_VERSION_HERE
unity.jdkPath=YOUR_PATH_HERE
```

**android/build.gradle:**
Update ndkVersion to match unity.androidNdkVersion:
```groovy
ndkVersion = "27.1.12297006"  // Or your Unity NDK version
```

### 6. Rebuild

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## Testing

1. Navigate to AR screen
2. Tap "Start AR Experience"
3. Select a crag
4. Select a model (download if needed)
5. Unity AR should launch with the 3D model

## Troubleshooting

- **Build errors:** Check gradle paths match your Unity installation
- **Unity doesn't load:** Verify UnityExport folder exists in android/
- **Model not found:** Ensure model is downloaded via ModelPicker

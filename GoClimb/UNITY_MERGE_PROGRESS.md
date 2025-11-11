# Unity Merge Progress

## ✅ Completed

### Components
- [x] `src/components/UnityViewerDirect.js` - Unity AR viewer component
- [ ] `src/components/ModelPicker.js` - Model selection component (NEEDS COPYING)

### Screens  
- [ ] `src/screens/UnityARScreen.js` - Main Unity AR screen (NEEDS COPYING)
- [ ] `src/screens/ARCragList.js` - AR crag list screen (NEEDS COPYING)
- [ ] `src/screens/RouteDataManager.js` - Route data management (NEEDS COPYING)

### Services
- [x] `src/services/storage/RouteDataStorage.js` - Local route data storage
- [x] `src/services/api/ModelRouteDataService.js` - Model route data API
- [ ] `src/services/firebase/FileDownloadHelper.js` - Firebase file downloads (NEEDS COPYING)
- [ ] `src/services/firebase/FirebaseStorageHelper.js` - Firebase storage helper (NEEDS COPYING)

### Utils
- [x] `src/utils/FullscreenHelper.js` - Fullscreen mode helper
- [x] `src/utils/LocalModelChecker.js` - Local model file checker

### Constants
- [x] `src/constants/folder_path.js` - File path constants

## 🔄 Next Steps

1. Copy remaining components (ModelPicker)
2. Copy remaining screens (UnityARScreen, ARCragList, RouteDataManager)
3. Copy Firebase helpers
4. Update existing files:
   - RootNavigator.js (add Unity routes)
   - AR.js (update to use ARCragList)
   - constants/api.js (add MODEL_ROUTE_DATA endpoints)
5. Update gradle configuration
6. Install npm packages

## 📝 Notes

- All copied files maintain your existing src structure
- No existing files have been modified yet
- Unity integration is additive - won't break existing features


// package com.SIMFYPS330.GoClimb;

// import com.facebook.react.ReactPackage;
// import com.facebook.react.bridge.NativeModule;
// import com.facebook.react.bridge.ReactApplicationContext;
// import com.facebook.react.uimanager.ViewManager;

// import java.util.ArrayList;
// import java.util.Collections;
// import java.util.List;

// public class UnityPackage implements ReactPackage {
//     private static final String TAG = "UnityPackage";

//     @Override
//     public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
//         android.util.Log.d(TAG, "Creating Unity native modules");
        
//         List<NativeModule> modules = new ArrayList<>();
        
//         try {
//             UnityModule unityModule = new UnityModule(reactContext);
//             modules.add(unityModule);
//             android.util.Log.d(TAG, "UnityModule created and added successfully");
//         } catch (Exception e) {
//             android.util.Log.e(TAG, "Error creating UnityModule", e);
//         }
        
//         android.util.Log.d(TAG, "Total native modules created: " + modules.size());
//         return modules;
//     }

//     @Override
//     public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
//         android.util.Log.d(TAG, "Creating view managers (none for Unity)");
//         return Collections.emptyList();
//     }
// }